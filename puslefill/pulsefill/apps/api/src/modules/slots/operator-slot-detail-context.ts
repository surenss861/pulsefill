import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildAvailableActions,
  buildQueueContext,
  toSlotRuleSignals,
  type OperatorSlotAvailableAction,
  type OperatorSlotQueueContext,
  type QueueCategory,
} from "./operator-slot-rules.js";

/** Re-export rules types for slot detail consumers. */
export type { OperatorSlotAvailableAction, OperatorSlotQueueContext, QueueCategory };
export type OperatorSlotQueueCategory = QueueCategory | null;
export type OperatorSlotQueueSection = OperatorSlotQueueContext["current_section"];

type SlotOfferRow = { status: string; expires_at: string };
type SlotClaimRow = { id: string; status: string; customer_id: string; claimed_at: string };

export type OperatorSlotDetailSignals = {
  slotStatus: string;
  slotCreatedAt: string;
  lastOfferBatchAt: string | null;
  resolutionStatus: string | null;
  offers: SlotOfferRow[];
  claims: SlotClaimRow[];
  latestFailedNotification: { error: string | null; created_at: string } | null;
  hasRecentNoMatchAudit: boolean;
};

function detailToRuleSignalsInput(detail: OperatorSlotDetailSignals, nowMs: number) {
  return toSlotRuleSignals({
    slotStatus: detail.slotStatus,
    createdAt: detail.slotCreatedAt,
    nowMs,
    offers: detail.offers,
    claims: detail.claims.map((c) => ({ status: c.status })),
    lastOfferBatchAt: detail.lastOfferBatchAt,
    latestFailedNotification: detail.latestFailedNotification
      ? { error: detail.latestFailedNotification.error }
      : null,
    hasRecentNoMatchAudit: detail.hasRecentNoMatchAudit,
    resolutionStatus: detail.resolutionStatus,
  });
}

/** Slot detail + action queue share `operator-slot-rules` classification. */
export function buildOperatorSlotQueueContext(
  detail: OperatorSlotDetailSignals,
  nowMs: number = Date.now(),
): OperatorSlotQueueContext {
  return buildQueueContext(detailToRuleSignalsInput(detail, nowMs));
}

export function buildOperatorAvailableActions(
  detail: OperatorSlotDetailSignals,
  queue: OperatorSlotQueueContext,
  nowMs: number = Date.now(),
): OperatorSlotAvailableAction[] {
  return buildAvailableActions(detailToRuleSignalsInput(detail, nowMs), queue);
}

/**
 * Loads notification + audit signals used for queue classification.
 * Call with the already-authorized `open_slots` row from `GET /v1/open-slots/:id`.
 */
export async function enrichOperatorSlotDetailSignals(
  admin: SupabaseClient,
  businessId: string,
  slotId: string,
  base: Omit<OperatorSlotDetailSignals, "latestFailedNotification" | "hasRecentNoMatchAudit">,
): Promise<OperatorSlotDetailSignals> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: failLogs }, { data: noMatchAudits }] = await Promise.all([
    admin
      .from("notification_logs")
      .select("status, error, created_at")
      .eq("open_slot_id", slotId)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("audit_events")
      .select("id")
      .eq("business_id", businessId)
      .eq("entity_type", "open_slot")
      .eq("entity_id", slotId)
      .eq("event_type", "offers_no_match")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const fail = (failLogs ?? [])[0] as { status: string; error: string | null; created_at: string } | undefined;

  return {
    ...base,
    latestFailedNotification: fail
      ? { error: fail.error, created_at: fail.created_at }
      : null,
    hasRecentNoMatchAudit: Boolean(noMatchAudits && noMatchAudits.length > 0),
  };
}

export function baseSignalsFromOpenSlotRow(row: Record<string, unknown>): Omit<
  OperatorSlotDetailSignals,
  "latestFailedNotification" | "hasRecentNoMatchAudit"
> {
  const offers = (row.slot_offers ?? []) as SlotOfferRow[];
  const claims = (row.slot_claims ?? []) as SlotClaimRow[];
  return {
    slotStatus: String(row.status ?? ""),
    slotCreatedAt: String(row.created_at ?? ""),
    lastOfferBatchAt: (row.last_offer_batch_at as string | null) ?? null,
    resolutionStatus: (row.resolution_status as string | null) ?? "none",
    offers: Array.isArray(offers) ? offers : [],
    claims: Array.isArray(claims) ? claims : [],
  };
}
