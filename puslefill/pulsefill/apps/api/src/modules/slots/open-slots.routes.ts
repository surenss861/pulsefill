import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendActionError, sendConfirmSuccess, sendSendOffersSuccess } from "../../lib/action-replies.js";
import { enqueueSendOfferNotificationJobs } from "../../lib/queue.js";
import { computeStandbyMatchesForOpenSlot } from "../../lib/open-slot-send-offers-match.js";
import {
  noMatchesReasonFromSummary,
  type OpenSlotRow,
  type StandbyMatchPack,
  type StandbyPreferenceRow,
} from "../../lib/standby-matcher.js";
import {
  handleCustomerBookingConfirmedNotificationEvent,
  handleCustomerOfferSentNotificationEvent,
} from "../notifications/notification-events.js";
import { createPushProviderFromEnv } from "../notifications/provider-factory.js";
import { requireCustomer, requireStaff } from "../../plugins/guards.js";
import { executeBulkOpenSlotAction } from "./bulk-actions.js";
import {
  buildOperatorActionRejectionDetails,
  checkOperatorActionAllowed,
  checkSendOrRetryOffersAllowed,
} from "./assert-operator-action-allowed.js";
import { canPerformAction } from "./operator-slot-rules.js";
import {
  baseSignalsFromOpenSlotRow,
  buildOperatorAvailableActions,
  buildOperatorSlotQueueContext,
  enrichOperatorSlotDetailSignals,
  type OperatorSlotAvailableAction,
  type OperatorSlotQueueContext,
} from "./operator-slot-detail-context.js";
import { loadSlotRuleContext } from "./load-slot-rule-context.js";
import {
  getCancelOpenSlotMutationTestDelegate,
  getConfirmOpenSlotMutationTestDelegate,
  getExpireOpenSlotMutationTestDelegate,
  getSendOffersMutationTestDelegate,
} from "./open-slots-route-test-seams.js";
import {
  loadStaffActorLabels,
  mergeMetadata,
  touchOpenSlotByStaff,
} from "./staff-attribution.js";

const createSlotBody = z
  .object({
    location_id: z.string().uuid().nullable().optional(),
    provider_id: z.string().uuid().nullable().optional(),
    service_id: z.string().uuid().nullable().optional(),
    provider_name_snapshot: z.string().max(200).nullable().optional(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    estimated_value_cents: z.number().int().min(0).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

const sendOffersBody = z
  .object({
    offer_ttl_seconds: z.number().int().min(60).max(7200).default(300),
    channel: z.enum(["push", "sms", "email"]).default("push"),
  })
  .strict();

const confirmBody = z
  .object({
    claim_id: z.string().uuid(),
  })
  .strict();

const claimBody = z
  .object({
    deposit_payment_intent_id: z.string().optional(),
  })
  .strict();

const RESOLUTION_STATUSES = [
  "none",
  "handled_manually",
  "no_retry_needed",
  "customer_contacted",
  "provider_unavailable",
  "ignore",
] as const;

const patchInternalNoteBody = z
  .object({
    resolution_status: z.enum(RESOLUTION_STATUSES),
    internal_note: z.string().max(5000).nullable().optional(),
  })
  .strict();

const bulkActionBody = z
  .object({
    action: z.enum(["retry_offers", "expire"]),
    open_slot_ids: z.array(z.string().uuid()).min(1).max(50),
  })
  .strict();

async function assertSlotInBusiness(
  admin: ReturnType<typeof createServiceSupabase>,
  slotId: string,
  businessId: string,
) {
  const { data } = await admin
    .from("open_slots")
    .select("id")
    .eq("id", slotId)
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}

type OpenSlotDetailResponse = {
  slot: Record<string, unknown>;
  queue_context: OperatorSlotQueueContext;
  available_actions: OperatorSlotAvailableAction[];
};

type OpenSlotDetailRouteLoadResult =
  | { kind: "ok"; payload: OpenSlotDetailResponse }
  | { kind: "not_found" };

let openSlotDetailTestDelegate:
  | null
  | ((
      admin: ReturnType<typeof createServiceSupabase>,
      input: { slotId: string; businessId: string },
    ) => Promise<OpenSlotDetailRouteLoadResult>) = null;

export function setOpenSlotDetailTestDelegate(
  delegate:
    | ((
        admin: ReturnType<typeof createServiceSupabase>,
        input: { slotId: string; businessId: string },
      ) => Promise<OpenSlotDetailRouteLoadResult>)
    | null,
) {
  openSlotDetailTestDelegate = delegate;
}

type NotificationEventHookDelegate = {
  onCustomerOfferSent?: (input: {
    businessId: string;
    offerId: string;
    customerId: string;
  }) => Promise<void>;
  onCustomerBookingConfirmed?: (input: {
    businessId: string;
    claimId: string;
  }) => Promise<void>;
};

let notificationEventHookDelegate: NotificationEventHookDelegate | null = null;

export function setNotificationEventHookTestDelegate(delegate: NotificationEventHookDelegate | null) {
  notificationEventHookDelegate = delegate;
}

async function notifyCustomerOfferSent(params: {
  env: FastifyInstance["env"];
  supabase: ReturnType<typeof createServiceSupabase>;
  businessId: string;
  offerId: string;
  customerId: string;
}) {
  if (notificationEventHookDelegate?.onCustomerOfferSent) {
    await notificationEventHookDelegate.onCustomerOfferSent({
      businessId: params.businessId,
      offerId: params.offerId,
      customerId: params.customerId,
    });
    return;
  }
  await handleCustomerOfferSentNotificationEvent({
    supabase: params.supabase as any,
    provider: createPushProviderFromEnv(params.env),
    nowIso: new Date().toISOString(),
    businessId: params.businessId,
    offerId: params.offerId,
    customerId: params.customerId,
  });
}

async function notifyCustomerBookingConfirmed(params: {
  env: FastifyInstance["env"];
  supabase: ReturnType<typeof createServiceSupabase>;
  businessId: string;
  claimId: string;
}) {
  if (notificationEventHookDelegate?.onCustomerBookingConfirmed) {
    await notificationEventHookDelegate.onCustomerBookingConfirmed({
      businessId: params.businessId,
      claimId: params.claimId,
    });
    return;
  }
  await handleCustomerBookingConfirmedNotificationEvent({
    supabase: params.supabase as any,
    provider: createPushProviderFromEnv(params.env),
    nowIso: new Date().toISOString(),
    businessId: params.businessId,
    claimId: params.claimId,
  });
}

async function loadOpenSlotDetailRoutePayload(
  admin: ReturnType<typeof createServiceSupabase>,
  input: { slotId: string; businessId: string },
): Promise<OpenSlotDetailRouteLoadResult> {
  const { slotId, businessId } = input;
  const ok = await assertSlotInBusiness(admin, slotId, businessId);
  if (!ok) return { kind: "not_found" };

  const { data, error } = await admin
    .from("open_slots")
    .select(
      "*, slot_offers(id, customer_id, channel, status, sent_at, expires_at), slot_claims(id, customer_id, claimed_at, status), last_touched_staff:staff_users!last_touched_by_staff_id(id, full_name, email)",
    )
    .eq("id", slotId)
    .single();
  if (error) {
    throw new Error("load_failed");
  }

  const row = data as Record<string, unknown>;
  const signalsBase = baseSignalsFromOpenSlotRow(row);
  const signals = await enrichOperatorSlotDetailSignals(admin, businessId, slotId, signalsBase);
  const queue_context = buildOperatorSlotQueueContext(signals);
  const available_actions = buildOperatorAvailableActions(signals, queue_context);
  const { slot_claims: claims, last_touched_staff: lastTouchedStaff, ...slotRest } = row;

  return {
    kind: "ok",
    payload: {
      slot: {
        ...slotRest,
        winning_claim: pickWinningClaim(claims),
        last_touched_by: lastTouchedStaff ?? null,
      },
      queue_context,
      available_actions,
    },
  };
}

function pickWinningClaim(claims: unknown): Record<string, unknown> | null {
  if (!Array.isArray(claims)) return null;
  const won = claims.find((c: { status?: string }) => c.status === "won" || c.status === "confirmed");
  return (won as Record<string, unknown>) ?? null;
}

function locationNameFromEmbed(loc: unknown): string | null {
  if (loc == null) return null;
  if (Array.isArray(loc)) {
    const first = loc[0];
    if (first && typeof first === "object" && first !== null && "name" in first) {
      return String((first as { name: unknown }).name);
    }
    return null;
  }
  if (typeof loc === "object" && "name" in loc) {
    return String((loc as { name: unknown }).name);
  }
  return null;
}

function mapSlotListRow(row: Record<string, unknown>) {
  const { slot_claims: claims, locations: loc, ...rest } = row;
  const location_name = locationNameFromEmbed(loc);
  return {
    ...rest,
    winning_claim: pickWinningClaim(claims),
    location_name,
  };
}

async function listOpenSlots(req: FastifyRequest, reply: FastifyReply) {
  const admin = createServiceSupabase(req.server.env);
  const q = req.query as { status?: string };

  let query = admin
    .from("open_slots")
    .select("*, slot_claims(id, customer_id, claimed_at, status), locations(name)")
    .eq("business_id", req.staff!.business_id)
    .order("starts_at", { ascending: true });

  if (q.status) {
    query = query.eq("status", q.status);
  }

  const { data, error } = await query;
  if (error) return reply.status(500).send({ error: "list_failed" });
  const rows = (data ?? []).map((r) => mapSlotListRow(r as Record<string, unknown>));
  return reply.send({ openSlots: rows });
}

export async function registerOpenSlotRoutes(app: FastifyInstance) {
  app.get("/v1/open-slots", { preHandler: requireStaff }, listOpenSlots);
  app.get("/v1/open-slots/mine", { preHandler: requireStaff }, listOpenSlots);

  app.post(
    "/v1/open-slots/bulk-action",
    { preHandler: requireStaff },
    async (req, reply) => {
      const parsed = bulkActionBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "invalid_request", message: "Invalid bulk action payload.", retryable: false },
        });
      }
      const admin = createServiceSupabase(req.server.env);
      const out = await executeBulkOpenSlotAction(admin, req.server.env, {
        businessId: req.staff!.business_id,
        staffId: req.staff!.id,
        authUserId: req.authUser!.id,
        action: parsed.data.action,
        openSlotIds: parsed.data.open_slot_ids,
      });
      return reply.send(out);
    },
  );

  app.get(
    "/v1/open-slots/:id/timeline",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, slotId, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin
        .from("audit_events")
        .select("id, actor_type, actor_id, event_type, entity_type, entity_id, metadata, created_at")
        .eq("entity_type", "open_slot")
        .eq("entity_id", slotId)
        .order("created_at", { ascending: true });

      if (error) {
        req.log.error({ error }, "slot timeline failed");
        return reply.status(500).send({ error: "timeline_failed" });
      }

      const raw = (data ?? []) as Array<{
        id: string;
        actor_type: string;
        actor_id: string | null;
        event_type: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>;

      const staffIds = raw
        .filter((e) => e.actor_type === "staff" && e.actor_id)
        .map((e) => e.actor_id as string);
      const labels = await loadStaffActorLabels(admin, req.staff!.business_id, staffIds);

      const events = raw.map((e) => {
        let actor_label: string | null = null;
        if (e.actor_type === "staff" && e.actor_id) {
          actor_label = labels.get(e.actor_id) ?? "Staff";
        } else if (e.actor_type === "customer") {
          actor_label = "Customer";
        } else if (e.actor_type === "system") {
          actor_label = "System";
        }

        return { ...e, actor_label };
      });

      return reply.send({ events });
    },
  );

  app.get(
    "/v1/open-slots/:id/notification-logs",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, slotId, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin
        .from("notification_logs")
        .select("id, customer_id, open_slot_id, slot_offer_id, channel, status, error, metadata, created_at")
        .eq("open_slot_id", slotId)
        .order("created_at", { ascending: false });

      if (error) {
        req.log.error({ error }, "notification logs failed");
        return reply.status(500).send({ error: "notification_logs_failed" });
      }

      return reply.send({ logs: data ?? [] });
    },
  );

  app.post(
    "/v1/open-slots",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = createSlotBody.parse(req.body ?? {});

      const { data, error } = await admin
        .from("open_slots")
        .insert({
          ...body,
          business_id: req.staff!.business_id,
          created_by: req.staff!.id,
          status: "open",
        })
        .select("*")
        .single();

      if (error) {
        req.log.error({ error }, "create slot failed");
        return reply.status(500).send({ error: "create_failed" });
      }

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "open_slot_created",
        entity_type: "open_slot",
        entity_id: data.id,
        metadata: mergeMetadata({}, req.authUser!.id),
      });

      await touchOpenSlotByStaff(admin, data.id, req.staff!.id);

      return reply.status(201).send(data);
    },
  );

  app.get(
    "/v1/open-slots/:id",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      try {
        const result = openSlotDetailTestDelegate
          ? await openSlotDetailTestDelegate(admin, { slotId: id, businessId: req.staff!.business_id })
          : await loadOpenSlotDetailRoutePayload(admin, { slotId: id, businessId: req.staff!.business_id });

        if (result.kind === "not_found") return reply.status(404).send({ error: "not_found" });
        return reply.send(result.payload);
      } catch {
        return reply.status(500).send({ error: "load_failed" });
      }
    },
  );

  app.get(
    "/v1/open-slots/:id/offers",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin.from("slot_offers").select("*").eq("open_slot_id", id).order("sent_at", {
        ascending: false,
      });
      if (error) return reply.status(500).send({ error: "list_failed" });
      return reply.send(data ?? []);
    },
  );

  app.post(
    "/v1/open-slots/:id/send-offers",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);
      const opts = sendOffersBody.parse(req.body ?? {});

      const sendGuard = await checkSendOrRetryOffersAllowed(admin, {
        openSlotId: id,
        businessId: req.staff!.business_id,
      });
      if (!sendGuard.ok) {
        if (sendGuard.status === 404) {
          return sendActionError(reply, 404, "not_found", "This opening no longer exists.", false);
        }
        return sendActionError(
          reply,
          409,
          "operator_action_not_allowed",
          "Send or retry offers is not allowed for this slot in its current state.",
          false,
          sendGuard.details as Record<string, unknown>,
        );
      }

      const slot = sendGuard.loaded.slot;
      const status = String(slot.status ?? "");
      const previousStatus = status;

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
      if (bizErr || !business) return reply.status(500).send({ error: "business_load_failed" });

      const slotRow = slot as OpenSlotRow;
      let uniqueMatches: StandbyPreferenceRow[];
      let matchPack: StandbyMatchPack;
      try {
        const computed = await computeStandbyMatchesForOpenSlot(admin, {
          openSlotId: id,
          slot: slotRow,
          businessTimezone: String((business as { timezone: string }).timezone),
        });
        uniqueMatches = computed.uniqueMatches;
        matchPack = computed.matchPack;
      } catch (e) {
        const code = e instanceof Error ? e.message : "";
        if (code === "prefs_load_failed") return reply.status(500).send({ error: "prefs_load_failed" });
        if (code === "memberships_load_failed") return reply.status(500).send({ error: "memberships_load_failed" });
        if (code === "offers_load_failed") return reply.status(500).send({ error: "offers_load_failed" });
        throw e;
      }

      if (uniqueMatches.length === 0) {
        const noReason = noMatchesReasonFromSummary(matchPack.summary);
        const operatorMessage =
          noReason === "no_active_preferences"
            ? "No active standby preferences found for this business yet. Invite customers or ask them to finish standby setup."
            : "No matching standby customers yet. Try widening the opening details, checking service/location fit, or inviting more customers to standby.";

        await admin.from("audit_events").insert({
          business_id: req.staff!.business_id,
          actor_type: "staff",
          actor_id: req.staff!.id,
          event_type: "offers_no_match",
          entity_type: "open_slot",
          entity_id: id,
          metadata: mergeMetadata(
            {
              matched: 0,
              no_matches_reason: noReason,
              match_summary: matchPack.summary,
              match_diagnostics: matchPack.diagnostics.slice(0, 60),
            },
            req.authUser!.id,
          ),
        });

        await touchOpenSlotByStaff(admin, id, req.staff!.id);

        return sendSendOffersSuccess(reply, {
          ok: true,
          result: "no_matches",
          open_slot_id: id,
          offers_created: 0,
          matched: 0,
          offer_ids: [],
          message: operatorMessage,
          no_matches_reason: noReason,
          match_summary: matchPack.summary,
        });
      }

      const expiresAt = new Date(Date.now() + opts.offer_ttl_seconds * 1000).toISOString();
      const offerRows = uniqueMatches.map((m) => ({
        open_slot_id: id,
        customer_id: m.customer_id,
        channel: opts.channel,
        expires_at: expiresAt,
        status: "sent" as const,
      }));

      const { data: inserted, error: insErr } = await admin
        .from("slot_offers")
        .upsert(offerRows, { onConflict: "open_slot_id,customer_id" })
        .select("id, customer_id, channel");

      if (insErr) {
        req.log.error({ insErr }, "offer upsert failed");
        return reply.status(500).send({ error: "offer_create_failed" });
      }

      const { error: slotUpdErr } = await admin
        .from("open_slots")
        .update({ status: "offered", last_offer_batch_at: new Date().toISOString() })
        .eq("id", id);
      if (slotUpdErr) return reply.status(500).send({ error: "slot_update_failed" });

      const offerRowsForQueue = inserted ?? [];
      const offerIds = offerRowsForQueue.map((o) => o.id);
      const queuePayloads = offerRowsForQueue.map((o) => ({
        offerId: o.id,
        openSlotId: id,
        customerId: o.customer_id,
        channel: o.channel as "push" | "sms" | "email",
      }));
      const queued = await enqueueSendOfferNotificationJobs(req.server.env, queuePayloads);

      for (const row of offerRowsForQueue) {
        await admin.from("notification_logs").insert({
          open_slot_id: id,
          slot_offer_id: row.id,
          customer_id: row.customer_id,
          channel: row.channel,
          status: queued.queued ? "queued" : "skipped_no_queue",
          error: null,
          metadata: {},
        });
      }

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "offers_sent",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata(
          { count: offerIds.length, queued: queued.queued, match_summary: matchPack.summary },
          req.authUser!.id,
        ),
      });

      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      for (const row of offerRowsForQueue) {
        try {
          await notifyCustomerOfferSent({
            env: req.server.env,
            supabase: admin,
            businessId: req.staff!.business_id,
            offerId: row.id,
            customerId: row.customer_id,
          });
        } catch (e) {
          req.log.warn({ e, offerId: row.id, customerId: row.customer_id }, "customer_offer_sent_notification_failed");
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
        match_summary: matchPack.summary,
        notification_queue: { queued: queued.queued, count: queued.count },
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/claim",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const openSlotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = claimBody.parse(req.body ?? {});

      const { data, error } = await admin.rpc("claim_open_slot", {
        p_open_slot_id: openSlotId,
        p_customer_id: req.customer!.id,
        p_deposit_payment_intent_id: body.deposit_payment_intent_id ?? null,
      });

      if (error) {
        req.log.error({ error }, "claim_open_slot rpc failed");
        return reply.status(500).send({ error: "claim_failed" });
      }

      const result = data as { ok?: boolean; error?: string; claim_id?: string };
      if (!result?.ok) {
        return reply.status(409).send({ error: result?.error ?? "claim_rejected" });
      }

      return reply.send({
        ok: true,
        claim_id: result.claim_id,
        claim: {
          id: result.claim_id,
          open_slot_id: openSlotId,
          customer_id: req.customer!.id,
          status: "won",
        },
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/confirm",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const parsed = confirmBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return sendActionError(reply, 400, "invalid_request", "A valid claim ID is required.", false);
      }
      const body = parsed.data;

      const loaded = await loadSlotRuleContext(admin, {
        openSlotId: slotId,
        businessId: req.staff!.business_id,
      });
      if (!loaded) {
        return sendActionError(reply, 404, "not_found", "This opening or claim no longer exists.", false);
      }

      const st = String(loaded.slot.status ?? "");

      if (st === "booked") {
        const { data: claimRow } = await admin
          .from("slot_claims")
          .select("id, status, open_slot_id")
          .eq("id", body.claim_id)
          .maybeSingle();

        if (!claimRow || (claimRow as { open_slot_id: string }).open_slot_id !== slotId) {
          return sendActionError(
            reply,
            404,
            "not_found",
            "This opening or claim no longer exists.",
            false,
          );
        }

        const cst = String((claimRow as { status: string }).status);
        if (cst === "confirmed") {
          return sendConfirmSuccess(reply, {
            ok: true,
            result: "already_confirmed",
            open_slot_id: slotId,
            claim_id: body.claim_id,
            status: "booked",
            message: "This booking was already confirmed.",
          });
        }

        return sendActionError(
          reply,
          409,
          "slot_terminal_state",
          "This opening can no longer be confirmed.",
          false,
          { current_status: st },
        );
      }

      if (st === "expired" || st === "cancelled") {
        return sendActionError(
          reply,
          409,
          "slot_terminal_state",
          "This opening can no longer be confirmed.",
          false,
          { current_status: st },
        );
      }

      if (st !== "claimed") {
        return sendActionError(
          reply,
          409,
          "slot_not_claimed",
          "This opening is no longer awaiting confirmation.",
          false,
          { current_status: st },
        );
      }

      const guardReload = await loadSlotRuleContext(admin, {
        openSlotId: slotId,
        businessId: req.staff!.business_id,
      });
      if (!guardReload) {
        return sendActionError(reply, 404, "not_found", "This opening or claim no longer exists.", false);
      }
      if (!canPerformAction("confirm_booking", guardReload.signals)) {
        return sendActionError(
          reply,
          409,
          "operator_action_not_allowed",
          "Confirm booking is not allowed for this slot in its current state.",
          false,
          buildOperatorActionRejectionDetails("confirm_booking", guardReload.signals) as Record<string, unknown>,
        );
      }

      const confirmTestMutation = getConfirmOpenSlotMutationTestDelegate();
      if (confirmTestMutation) {
        await confirmTestMutation({
          openSlotId: slotId,
          claimId: body.claim_id,
          businessId: req.staff!.business_id,
          staffId: req.staff!.id,
          authUserId: req.authUser!.id,
        });
        try {
          await notifyCustomerBookingConfirmed({
            env: req.server.env,
            supabase: admin,
            businessId: req.staff!.business_id,
            claimId: body.claim_id,
          });
        } catch (e) {
          req.log.warn({ e, claimId: body.claim_id }, "customer_booking_confirmed_notification_failed");
        }
        return sendConfirmSuccess(reply, {
          ok: true,
          result: "confirmed",
          open_slot_id: slotId,
          claim_id: body.claim_id,
          status: "booked",
          message: "Booking confirmed.",
        });
      }

      const { data, error } = await admin.rpc("confirm_open_slot_claim", {
        p_open_slot_id: slotId,
        p_claim_id: body.claim_id,
        p_staff_auth_user_id: req.authUser!.id,
      });

      if (error) {
        req.log.error({ error }, "confirm rpc failed");
        return sendActionError(
          reply,
          500,
          "server_error",
          "Could not confirm this booking. Try again.",
          true,
        );
      }

      const result = data as { ok?: boolean; error?: string; status?: string };
      if (!result?.ok) {
        const err = result?.error ?? "";
        if (err === "forbidden") {
          return sendActionError(
            reply,
            403,
            "forbidden",
            "You do not have access to confirm this opening.",
            false,
          );
        }
        if (err === "slot_not_found") {
          return sendActionError(reply, 404, "not_found", "This opening or claim no longer exists.", false);
        }
        if (err === "slot_not_claimed") {
          const cs = result.status ? String(result.status) : undefined;
          if (cs === "expired" || cs === "cancelled") {
            return sendActionError(
              reply,
              409,
              "slot_terminal_state",
              "This opening can no longer be confirmed.",
              false,
              { current_status: cs },
            );
          }
          return sendActionError(
            reply,
            409,
            "slot_not_claimed",
            "This opening is no longer awaiting confirmation.",
            false,
            cs ? { current_status: cs } : undefined,
          );
        }
        if (err === "claim_not_found" || err === "claim_not_won") {
          return sendActionError(
            reply,
            409,
            "claim_mismatch",
            "That claim no longer matches this opening.",
            false,
          );
        }
        return sendActionError(
          reply,
          409,
          "slot_terminal_state",
          "This opening can no longer be confirmed.",
          false,
        );
      }

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "slot_confirmed",
        entity_type: "open_slot",
        entity_id: slotId,
        metadata: mergeMetadata({ claim_id: body.claim_id }, req.authUser!.id),
      });

      await touchOpenSlotByStaff(admin, slotId, req.staff!.id);

      try {
        await notifyCustomerBookingConfirmed({
          env: req.server.env,
          supabase: admin,
          businessId: req.staff!.business_id,
          claimId: body.claim_id,
        });
      } catch (e) {
        req.log.warn({ e, claimId: body.claim_id }, "customer_booking_confirmed_notification_failed");
      }

      return sendConfirmSuccess(reply, {
        ok: true,
        result: "confirmed",
        open_slot_id: slotId,
        claim_id: body.claim_id,
        status: "booked",
        message: "Booking confirmed.",
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/cancel",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const cancelGuard = await checkOperatorActionAllowed(admin, {
        openSlotId: id,
        businessId: req.staff!.business_id,
        action: "cancel_slot",
      });
      if (!cancelGuard.ok) {
        if (cancelGuard.status === 404) {
          return reply.status(404).send({ error: "not_found" });
        }
        return sendActionError(
          reply,
          409,
          "operator_action_not_allowed",
          "Cancel slot is not allowed for this opening in its current state.",
          false,
          cancelGuard.details as Record<string, unknown>,
        );
      }

      const cancelTestMutation = getCancelOpenSlotMutationTestDelegate();
      let result: { ok?: boolean; error?: string } | null = null;
      try {
        const { data, error } = cancelTestMutation
          ? ({ data: null, error: null } as const)
          : await admin.rpc("staff_cancel_open_slot", {
              p_open_slot_id: id,
              p_staff_auth_user_id: req.authUser!.id,
            });

        const mutationOut = cancelTestMutation
          ? await cancelTestMutation({
              openSlotId: id,
              businessId: req.staff!.business_id,
              staffId: req.staff!.id,
              authUserId: req.authUser!.id,
            })
          : null;

        if (!cancelTestMutation && error) {
          throw new Error("cancel_rpc_failed");
        }
        result = (mutationOut ?? (data as { ok?: boolean; error?: string })) as { ok?: boolean; error?: string };
      } catch (error) {
        req.log.error({ error }, "cancel slot mutation failed");
        return sendActionError(reply, 500, "cancel_slot_failed", "Could not cancel slot.", true);
      }

      if (!result?.ok) return reply.status(409).send({ error: result?.error ?? "cancel_rejected" });

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "slot_cancelled",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata({ source: "staff_action" }, req.authUser!.id),
      });
      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      return reply.send({
        ok: true,
        result: "cancelled",
        status: "cancelled",
        message: "Slot cancelled.",
      });
    },
  );

  app.patch(
    "/v1/open-slots/:id/internal-note",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = patchInternalNoteBody.safeParse(req.body ?? {});
      if (!body.success) {
        return reply.status(400).send({
          error: { code: "invalid_request", message: "Invalid internal note payload.", retryable: false },
        });
      }

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) {
        return reply.status(404).send({
          error: { code: "not_found", message: "This opening no longer exists.", retryable: false },
        });
      }

      const patch: Record<string, unknown> = {
        resolution_status: body.data.resolution_status,
        internal_note_updated_at: new Date().toISOString(),
      };
      if (body.data.internal_note !== undefined) {
        const v = body.data.internal_note;
        patch.internal_note = v == null || v.trim() === "" ? null : v.trim();
      }

      const { data: updated, error: updErr } = await admin
        .from("open_slots")
        .update(patch)
        .eq("id", id)
        .select("internal_note, resolution_status, internal_note_updated_at")
        .single();

      if (updErr || !updated) {
        req.log.error({ updErr }, "internal note update failed");
        return reply.status(500).send({
          error: { code: "server_error", message: "Could not save internal note.", retryable: true },
        });
      }

      const row = updated as {
        internal_note: string | null;
        resolution_status: string;
        internal_note_updated_at: string | null;
      };

      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "operator_internal_note_updated",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata({ resolution_status: row.resolution_status }, req.authUser!.id),
      });

      return reply.send({
        ok: true,
        open_slot_id: id,
        internal_note: row.internal_note,
        resolution_status: row.resolution_status,
        internal_note_updated_at: row.internal_note_updated_at,
        message: "Internal note saved.",
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/expire",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const expireGuard = await checkOperatorActionAllowed(admin, {
        openSlotId: id,
        businessId: req.staff!.business_id,
        action: "expire_slot",
      });
      if (!expireGuard.ok) {
        if (expireGuard.status === 404) {
          return reply.status(404).send({ error: "not_found" });
        }
        return sendActionError(
          reply,
          409,
          "operator_action_not_allowed",
          "Expire slot is not allowed for this opening in its current state.",
          false,
          expireGuard.details as Record<string, unknown>,
        );
      }

      const expireTestMutation = getExpireOpenSlotMutationTestDelegate();
      let result: { ok?: boolean; error?: string } | null = null;
      try {
        const { data, error } = expireTestMutation
          ? ({ data: null, error: null } as const)
          : await admin.rpc("staff_expire_open_slot", {
              p_open_slot_id: id,
              p_staff_auth_user_id: req.authUser!.id,
            });

        const mutationOut = expireTestMutation
          ? await expireTestMutation({
              openSlotId: id,
              businessId: req.staff!.business_id,
              staffId: req.staff!.id,
              authUserId: req.authUser!.id,
            })
          : null;

        if (!expireTestMutation && error) {
          throw new Error("expire_rpc_failed");
        }
        result = (mutationOut ?? (data as { ok?: boolean; error?: string })) as { ok?: boolean; error?: string };
      } catch (error) {
        req.log.error({ error }, "expire slot mutation failed");
        return sendActionError(reply, 500, "expire_slot_failed", "Could not expire slot.", true);
      }

      if (!result?.ok) return reply.status(409).send({ error: result?.error ?? "expire_rejected" });

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "slot_expired",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata({ source: "staff_action" }, req.authUser!.id),
      });
      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      return reply.send({
        ok: true,
        result: "expired",
        status: "expired",
        message: "Slot expired.",
      });
    },
  );
}
