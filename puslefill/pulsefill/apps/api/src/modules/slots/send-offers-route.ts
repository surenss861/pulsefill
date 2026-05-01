import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { sendActionError, sendSendOffersSuccess } from "../../lib/action-replies.js";
import { enqueueSendOfferNotificationJobs } from "../../lib/queue.js";
import { computeStandbyMatchesForOpenSlot } from "../../lib/open-slot-send-offers-match.js";
import {
  noMatchesReasonFromSummary,
  type MatchSummary,
  type OpenSlotRow,
} from "../../lib/standby-matcher.js";
import { checkSendOrRetryOffersAllowed } from "./assert-operator-action-allowed.js";
import { getSendOffersMutationTestDelegate } from "./open-slots-route-test-seams.js";
import { notifyCustomerOfferSent } from "./notification-hooks.js";
import {
  commitSendOffersAtomically,
  markSendOfferNotificationLogs,
  recordNoMatchesAtomically,
} from "./send-offers-transaction.js";

const sendOffersBody = z
  .object({
    offer_ttl_seconds: z.number().int().min(60).max(7200).default(300),
    channel: z.enum(["push", "sms", "email"]).default("push"),
  })
  .strict();

export async function sendOpenSlotOffersRouteHandler(req: FastifyRequest, reply: FastifyReply) {
  const admin = createServiceSupabase(req.server.env);
  const id = z.string().uuid().parse((req.params as { id?: string }).id);
  const opts = sendOffersBody.parse(req.body ?? {});

  const sendGuard = await checkSendOrRetryOffersAllowed(admin, {
    openSlotId: id,
    businessId: req.staff!.business_id,
  });
  if (!sendGuard.ok) {
    if (sendGuard.status === 404) {
      return sendActionError(req, reply, 404, "not_found", "This opening no longer exists.", false);
    }
    return sendActionError(
      req,
      reply,
      409,
      "operator_action_not_allowed",
      "Send or retry offers is not allowed for this slot in its current state.",
      false,
      sendGuard.details as Record<string, unknown>,
    );
  }

  const slot = sendGuard.loaded.slot;
  const previousStatus = String(slot.status ?? "");

  const sendOffersTestMutation = getSendOffersMutationTestDelegate();
  if (sendOffersTestMutation) {
    const out = await sendOffersTestMutation({
      openSlotId: id,
      businessId: req.staff!.business_id,
      staffId: req.staff!.id,
      authUserId: req.authUser!.id,
      previousStatus,
    });
    if (out.offer_customer_ids?.length) {
      for (const pair of out.offer_customer_ids) {
        try {
          await notifyCustomerOfferSent({
            env: req.server.env,
            supabase: admin,
            businessId: req.staff!.business_id,
            offerId: pair.offer_id,
            customerId: pair.customer_id,
          });
        } catch (e) {
          req.log.warn({ e, pair }, "customer_offer_sent_notification_failed");
        }
      }
    }
    return sendSendOffersSuccess(reply, {
      ok: true,
      open_slot_id: id,
      offers_created: out.offer_ids?.length ?? out.matched ?? 0,
      ...out,
    });
  }

  const { data: business, error: bizErr } = await admin
    .from("businesses")
    .select("*")
    .eq("id", slot.business_id)
    .single();
  if (bizErr || !business) return sendJson(req, reply, 500, { error: "business_load_failed" });

  const slotRow = slot as OpenSlotRow;
  let computed: Awaited<ReturnType<typeof computeMatches>>;
  try {
    computed = await computeMatches(admin, id, slotRow, String((business as { timezone: string }).timezone));
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "prefs_load_failed") return sendJson(req, reply, 500, { error: "prefs_load_failed" });
    if (code === "memberships_load_failed") return sendJson(req, reply, 500, { error: "memberships_load_failed" });
    if (code === "offers_load_failed") return sendJson(req, reply, 500, { error: "offers_load_failed" });
    throw e;
  }

  if (computed.uniqueMatches.length === 0) {
    return handleNoMatches(req, reply, {
      admin,
      openSlotId: id,
      matchSummary: computed.matchPack.summary,
      matchDiagnostics: computed.matchPack.diagnostics.slice(0, 60),
    });
  }

  const expiresAt = new Date(Date.now() + opts.offer_ttl_seconds * 1000).toISOString();
  const committed = await commitSendOffersAtomically(admin, {
    openSlotId: id,
    businessId: req.staff!.business_id,
    staffId: req.staff!.id,
    authUserId: req.authUser!.id,
    queueEnabled: Boolean(req.server.env.REDIS_URL),
    matchSummary: computed.matchPack.summary,
    offerRows: computed.uniqueMatches.map((m) => ({
      customer_id: m.customer_id,
      channel: opts.channel,
      expires_at: expiresAt,
    })),
  });
  if (!committed.ok) {
    return sendAtomicSendOffersError(req, reply, committed.error);
  }

  const offerRowsForQueue = committed.offer_customer_ids;
  const offerIds = committed.offer_ids;
  const queuePayloads = offerRowsForQueue.map((o) => ({
    offerId: o.offer_id,
    openSlotId: id,
    customerId: o.customer_id,
    channel: o.channel,
  }));

  let queued = { queued: false, count: 0 };
  let queueError: string | null = null;
  try {
    queued = await enqueueSendOfferNotificationJobs(req.server.env, queuePayloads);
  } catch (e) {
    queueError = e instanceof Error ? e.message : "queue_failed";
    req.log.error({ e, openSlotId: id }, "send_offer_notification_queue_failed");
  }

  await markSendOfferNotificationLogs(admin, {
    openSlotId: id,
    offerIds,
    status: queueError ? "queue_failed" : queued.queued ? "queued" : "skipped_no_queue",
    metadata: queueError ? { queue_error: queueError } : {},
  });

  for (const row of offerRowsForQueue) {
    try {
      await notifyCustomerOfferSent({
        env: req.server.env,
        supabase: admin,
        businessId: req.staff!.business_id,
        offerId: row.offer_id,
        customerId: row.customer_id,
      });
    } catch (e) {
      req.log.warn({ e, offerId: row.offer_id, customerId: row.customer_id }, "customer_offer_sent_notification_failed");
    }
  }

  const count = offerIds.length;
  const resultKind = previousStatus === "open" ? "offers_sent" : "offers_retried";
  const message =
    count === 0
      ? "No new offers created (all customers may already have an offer for this slot)."
      : resultKind === "offers_sent"
        ? `Sent ${count} offer${count === 1 ? "" : "s"}.`
        : `Retried ${count} offer${count === 1 ? "" : "s"}.`;

  return sendSendOffersSuccess(reply, {
    ok: true,
    result: resultKind,
    open_slot_id: id,
    offers_created: count,
    matched: count,
    offer_ids: offerIds,
    message,
    match_summary: computed.matchPack.summary,
    notification_queue: { queued: queued.queued, count: queued.count },
  });
}

async function computeMatches(
  admin: ReturnType<typeof createServiceSupabase>,
  openSlotId: string,
  slot: OpenSlotRow,
  businessTimezone: string,
) {
  try {
    return await computeStandbyMatchesForOpenSlot(admin, {
      openSlotId,
      slot,
      businessTimezone,
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "prefs_load_failed") throw new Error("prefs_load_failed");
    if (code === "memberships_load_failed") throw new Error("memberships_load_failed");
    if (code === "offers_load_failed") throw new Error("offers_load_failed");
    throw e;
  }
}

async function handleNoMatches(
  req: FastifyRequest,
  reply: FastifyReply,
  input: {
    admin: ReturnType<typeof createServiceSupabase>;
    openSlotId: string;
    matchSummary: MatchSummary;
    matchDiagnostics: unknown[];
  },
) {
  const noReason = noMatchesReasonFromSummary(input.matchSummary);
  const operatorMessage =
    noReason === "no_active_preferences"
      ? "No active standby preferences found for this business yet. Invite customers or ask them to finish standby setup."
      : "No matching standby customers yet. Try widening the opening details, checking service/location fit, or inviting more customers to standby.";

  const recorded = await recordNoMatchesAtomically(input.admin, {
    openSlotId: input.openSlotId,
    businessId: req.staff!.business_id,
    staffId: req.staff!.id,
    authUserId: req.authUser!.id,
    noMatchesReason: noReason,
    matchSummary: input.matchSummary,
    matchDiagnostics: input.matchDiagnostics,
  });
  if (!recorded.ok) {
    return sendAtomicSendOffersError(req, reply, recorded.error);
  }

  return sendSendOffersSuccess(reply, {
    ok: true,
    result: "no_matches",
    open_slot_id: input.openSlotId,
    offers_created: 0,
    matched: 0,
    offer_ids: [],
    message: operatorMessage,
    no_matches_reason: noReason,
    match_summary: input.matchSummary,
  });
}

function sendAtomicSendOffersError(req: FastifyRequest, reply: FastifyReply, error: string) {
  if (error === "slot_not_found") {
    return sendActionError(req, reply, 404, "not_found", "This opening no longer exists.", false);
  }
  if (error === "forbidden") {
    return sendActionError(req, reply, 403, "forbidden", "You cannot modify this opening.", false);
  }
  if (error === "slot_not_sendable" || error === "offers_in_flight") {
    return sendActionError(
      req,
      reply,
      409,
      "operator_action_not_allowed",
      "Send or retry offers is not allowed for this slot in its current state.",
      false,
    );
  }
  return sendActionError(req, reply, 500, "server_error", "Could not send offers.", true);
}
