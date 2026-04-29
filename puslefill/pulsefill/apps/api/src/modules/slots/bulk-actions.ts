import type { Env } from "../../config/env.js";
import type { createServiceSupabase } from "../../config/supabase.js";
import { enqueueSendOfferNotificationJobs } from "../../lib/queue.js";
import { computeStandbyMatchesForOpenSlot } from "../../lib/open-slot-send-offers-match.js";
import {
  noMatchesReasonFromSummary,
  type OpenSlotRow,
  type StandbyMatchPack,
  type StandbyPreferenceRow,
} from "../../lib/standby-matcher.js";
import { canPerformAction } from "./operator-slot-rules.js";
import { loadSlotRuleContext } from "./load-slot-rule-context.js";
import { mergeMetadata, touchOpenSlotByStaff } from "./staff-attribution.js";

type Admin = ReturnType<typeof createServiceSupabase>;

export type BulkSlotActionKind = "retry_offers" | "expire";

export type BulkSlotActionItemResult = {
  open_slot_id: string;
  status: "processed" | "skipped" | "failed";
  code?: string;
  message?: string;
};

export type BulkSlotActionResponse = {
  ok: true;
  action: BulkSlotActionKind;
  summary: {
    requested: number;
    processed: number;
    skipped: number;
    failed: number;
  };
  results: BulkSlotActionItemResult[];
  message: string;
};

const DEFAULT_OFFER_TTL = 300;
const DEFAULT_CHANNEL = "push" as const;

function dedupePreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function okProcessed(openSlotId: string): BulkSlotActionItemResult {
  return { open_slot_id: openSlotId, status: "processed" };
}

function withId(openSlotId: string, r: Omit<BulkSlotActionItemResult, "open_slot_id">): BulkSlotActionItemResult {
  return { ...r, open_slot_id: openSlotId };
}

function skip(code: string, message: string): Omit<BulkSlotActionItemResult, "open_slot_id"> {
  return { status: "skipped", code, message };
}

function fail(code: string, message: string): Omit<BulkSlotActionItemResult, "open_slot_id"> {
  return { status: "failed", code, message };
}

async function retryOffersOne(
  admin: Admin,
  env: Env,
  ctx: {
    businessId: string;
    staffId: string;
    authUserId: string;
    slotId: string;
  },
): Promise<BulkSlotActionItemResult> {
  const { businessId, staffId, authUserId, slotId } = ctx;
  const ruleCtx = await loadSlotRuleContext(admin, { openSlotId: slotId, businessId });
  if (!ruleCtx) {
    return withId(slotId, skip("not_found", "This opening no longer exists."));
  }
  if (!canPerformAction("retry_offers", ruleCtx.signals)) {
    return withId(
      slotId,
      fail(
        "operator_action_not_allowed",
        "Retry offers is not allowed for this slot in its current state.",
      ),
    );
  }

  const slot = ruleCtx.slot;
  const businessIdRow = String(slot.business_id ?? "");
  if (businessIdRow !== businessId) {
    return withId(slotId, skip("not_found", "This opening no longer exists."));
  }

  const { data: business, error: bizErr } = await admin.from("businesses").select("*").eq("id", businessIdRow).single();
  if (bizErr || !business) {
    return withId(slotId, fail("business_load_failed", "Could not load business for this slot."));
  }

  const slotRow = slot as OpenSlotRow;
  let uniqueMatches: StandbyPreferenceRow[];
  let matchPack: StandbyMatchPack;
  try {
    const computed = await computeStandbyMatchesForOpenSlot(admin, {
      openSlotId: slotId,
      slot: slotRow,
      businessTimezone: String((business as { timezone: string }).timezone),
    });
    uniqueMatches = computed.uniqueMatches;
    matchPack = computed.matchPack;
  } catch {
    return withId(slotId, fail("prefs_load_failed", "Could not load standby preferences or memberships."));
  }

  const bulkExtra = { source: "bulk_action" as const, bulk_action: "retry_offers" as const };

  if (uniqueMatches.length === 0) {
    const noReason = noMatchesReasonFromSummary(matchPack.summary);
    await admin.from("audit_events").insert({
      business_id: businessId,
      actor_type: "staff",
      actor_id: staffId,
      event_type: "offers_no_match",
      entity_type: "open_slot",
      entity_id: slotId,
      metadata: mergeMetadata(
        {
          matched: 0,
          no_matches_reason: noReason,
          match_summary: matchPack.summary,
          match_diagnostics: matchPack.diagnostics.slice(0, 60),
          ...bulkExtra,
        },
        authUserId,
      ),
    });
    await touchOpenSlotByStaff(admin, slotId, staffId);
    return okProcessed(slotId);
  }

  const expiresAt = new Date(Date.now() + DEFAULT_OFFER_TTL * 1000).toISOString();
  const offerRows = uniqueMatches.map((m) => ({
    open_slot_id: slotId,
    customer_id: m.customer_id,
    channel: DEFAULT_CHANNEL,
    expires_at: expiresAt,
    status: "sent" as const,
  }));

  const { data: inserted, error: insErr } = await admin
    .from("slot_offers")
    .upsert(offerRows, { onConflict: "open_slot_id,customer_id" })
    .select("id, customer_id, channel");

  if (insErr) {
    return withId(slotId, fail("offer_create_failed", "Could not create offers for this slot."));
  }

  const { error: slotUpdErr } = await admin
    .from("open_slots")
    .update({ status: "offered", last_offer_batch_at: new Date().toISOString() })
    .eq("id", slotId);
  if (slotUpdErr) {
    return withId(slotId, fail("slot_update_failed", "Could not update slot status."));
  }

  const offerRowsForQueue = inserted ?? [];
  const queuePayloads = offerRowsForQueue.map((o) => ({
    offerId: o.id,
    openSlotId: slotId,
    customerId: o.customer_id,
    channel: o.channel as "push" | "sms" | "email",
  }));
  const queued = await enqueueSendOfferNotificationJobs(env, queuePayloads);

  for (const row of offerRowsForQueue) {
    await admin.from("notification_logs").insert({
      open_slot_id: slotId,
      slot_offer_id: row.id,
      customer_id: row.customer_id,
      channel: row.channel,
      status: queued.queued ? "queued" : "skipped_no_queue",
      error: null,
      metadata: {},
    });
  }

  await admin.from("audit_events").insert({
    business_id: businessId,
    actor_type: "staff",
    actor_id: staffId,
    event_type: "offers_sent",
    entity_type: "open_slot",
    entity_id: slotId,
    metadata: mergeMetadata(
      { count: offerRowsForQueue.length, queued: queued.queued, match_summary: matchPack.summary, ...bulkExtra },
      authUserId,
    ),
  });

  await touchOpenSlotByStaff(admin, slotId, staffId);
  return okProcessed(slotId);
}

async function expireOne(
  admin: Admin,
  ctx: { businessId: string; staffId: string; authUserId: string; slotId: string },
): Promise<BulkSlotActionItemResult> {
  const { businessId, staffId, authUserId, slotId } = ctx;

  const ruleCtx = await loadSlotRuleContext(admin, { openSlotId: slotId, businessId });
  if (!ruleCtx) {
    return withId(slotId, skip("not_found", "This opening no longer exists."));
  }
  if (!canPerformAction("expire_slot", ruleCtx.signals)) {
    return withId(
      slotId,
      fail(
        "operator_action_not_allowed",
        "Expire slot is not allowed for this opening in its current state.",
      ),
    );
  }

  const { data, error } = await admin.rpc("staff_expire_open_slot", {
    p_open_slot_id: slotId,
    p_staff_auth_user_id: authUserId,
  });

  if (error) {
    return withId(slotId, fail("expire_failed", error.message ?? "Expire failed."));
  }

  const result = data as { ok?: boolean; error?: string; status?: string };
  if (!result?.ok) {
    const err = result?.error ?? "";
    if (err === "slot_not_found") {
      return withId(slotId, skip("not_found", "This opening no longer exists."));
    }
    if (err === "forbidden") {
      return withId(slotId, skip("forbidden", "You do not have access to this opening."));
    }
    if (err === "slot_not_expirable") {
      const st = result.status ? String(result.status) : "unknown";
      return withId(
        slotId,
        skip("slot_not_expirable", `This opening cannot be expired in its current state (${st}).`),
      );
    }
    return withId(slotId, skip("expire_rejected", "Could not expire this opening."));
  }

  await admin.from("audit_events").insert({
    business_id: businessId,
    actor_type: "staff",
    actor_id: staffId,
    event_type: "slot_expired",
    entity_type: "open_slot",
    entity_id: slotId,
    metadata: mergeMetadata({ source: "bulk_action", bulk_action: "expire" }, authUserId),
  });
  await touchOpenSlotByStaff(admin, slotId, staffId);
  return okProcessed(slotId);
}

export async function executeBulkOpenSlotAction(
  admin: Admin,
  env: Env,
  args: {
    businessId: string;
    staffId: string;
    authUserId: string;
    action: BulkSlotActionKind;
    openSlotIds: string[];
  },
): Promise<BulkSlotActionResponse> {
  const uniqueIds = dedupePreserveOrder(args.openSlotIds);
  const results: BulkSlotActionItemResult[] = [];

  if (uniqueIds.length === 0) {
    return {
      ok: true,
      action: args.action,
      summary: { requested: 0, processed: 0, skipped: 0, failed: 0 },
      results: [],
      message: "No slots to process.",
    };
  }

  const { data: rows, error: loadErr } = await admin
    .from("open_slots")
    .select("*")
    .in("id", uniqueIds)
    .eq("business_id", args.businessId);

  if (loadErr) {
    for (const id of uniqueIds) {
      results.push(withId(id, fail("load_failed", "Could not load slots.")));
    }
    const failed = results.length;
    return {
      ok: true,
      action: args.action,
      summary: { requested: uniqueIds.length, processed: 0, skipped: 0, failed },
      results,
      message: "Bulk action failed: could not load slots.",
    };
  }

  const byId = new Map((rows ?? []).map((r) => [String((r as { id: string }).id), r as Record<string, unknown>]));

  for (const slotId of uniqueIds) {
    const slot = byId.get(slotId);
    if (!slot) {
      results.push(withId(slotId, skip("not_found", "This opening is not in your business or no longer exists.")));
      continue;
    }

    try {
      if (args.action === "retry_offers") {
        const r = await retryOffersOne(admin, env, {
          businessId: args.businessId,
          staffId: args.staffId,
          authUserId: args.authUserId,
          slotId,
        });
        results.push(r);
      } else {
        const r = await expireOne(admin, {
          businessId: args.businessId,
          staffId: args.staffId,
          authUserId: args.authUserId,
          slotId,
        });
        results.push(r);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected error.";
      results.push(withId(slotId, fail("server_error", msg)));
    }
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "processed") processed += 1;
    else if (r.status === "skipped") skipped += 1;
    else failed += 1;
  }

  const actionLabel = args.action === "retry_offers" ? "Bulk retry offers" : "Bulk expire";
  const message =
    failed > 0
      ? `${actionLabel} finished: ${processed} processed, ${skipped} skipped, ${failed} failed.`
      : `${actionLabel} finished: ${processed} processed, ${skipped} skipped.`;

  return {
    ok: true,
    action: args.action,
    summary: {
      requested: uniqueIds.length,
      processed,
      skipped,
      failed,
    },
    results,
    message,
  };
}
