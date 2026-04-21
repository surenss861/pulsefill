import type { SupabaseClient } from "@supabase/supabase-js";

import { toSlotRuleSignals, type SlotRuleSignals } from "./operator-slot-rules.js";

export type LoadedSlotRuleContext = {
  /** Full `open_slots` row (no embedded relations). */
  slot: Record<string, unknown>;
  signals: SlotRuleSignals;
};

export type LoadSlotRuleContextParams = {
  openSlotId: string;
  businessId: string;
  nowMs?: number;
};

type LoadSlotRuleContextTestDelegate = (
  admin: SupabaseClient,
  params: LoadSlotRuleContextParams,
) => Promise<LoadedSlotRuleContext | null>;

let loadSlotRuleContextTestDelegate: LoadSlotRuleContextTestDelegate | null = null;

/**
 * Route-test override for `loadSlotRuleContext`. Only active when `PULSEFILL_API_TEST=1`.
 * Always reset to `null` in `afterEach` / `after` so non-test paths stay real.
 */
export function setLoadSlotRuleContextTestDelegate(delegate: LoadSlotRuleContextTestDelegate | null) {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    if (delegate != null) {
      throw new Error("setLoadSlotRuleContextTestDelegate is only valid when PULSEFILL_API_TEST=1");
    }
    return;
  }
  loadSlotRuleContextTestDelegate = delegate;
}

/**
 * Loads authoritative slot state + related rows and builds `SlotRuleSignals`.
 * Call at request time for mutating routes — do not trust client snapshots.
 */
export async function loadSlotRuleContext(
  admin: SupabaseClient,
  params: LoadSlotRuleContextParams,
): Promise<LoadedSlotRuleContext | null> {
  if (process.env.PULSEFILL_API_TEST === "1" && loadSlotRuleContextTestDelegate) {
    return loadSlotRuleContextTestDelegate(admin, params);
  }

  const nowMs = params.nowMs ?? Date.now();
  const since = new Date(nowMs - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: slot, error: slotErr } = await admin
    .from("open_slots")
    .select("*")
    .eq("id", params.openSlotId)
    .eq("business_id", params.businessId)
    .maybeSingle();

  if (slotErr || !slot) return null;

  const slotRow = slot as Record<string, unknown>;

  const [{ data: offers }, { data: claims }, { data: failLogs }, { data: noMatchAudits }] = await Promise.all([
    admin
      .from("slot_offers")
      .select("status, expires_at")
      .eq("open_slot_id", params.openSlotId),
    admin
      .from("slot_claims")
      .select("id, status, customer_id, claimed_at")
      .eq("open_slot_id", params.openSlotId),
    admin
      .from("notification_logs")
      .select("status, error, created_at")
      .eq("open_slot_id", params.openSlotId)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("audit_events")
      .select("id")
      .eq("business_id", params.businessId)
      .eq("entity_type", "open_slot")
      .eq("entity_id", params.openSlotId)
      .eq("event_type", "offers_no_match")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const offerRows = (offers ?? []) as Array<{ status: string; expires_at: string }>;
  const claimRows = (claims ?? []) as Array<{ status: string }>;
  const fail = (failLogs ?? [])[0] as { error: string | null } | undefined;

  const signals = toSlotRuleSignals({
    slotStatus: String(slotRow.status ?? ""),
    createdAt: String(slotRow.created_at ?? ""),
    nowMs,
    offers: offerRows,
    claims: claimRows.map((c) => ({ status: c.status })),
    lastOfferBatchAt: (slotRow.last_offer_batch_at as string | null) ?? null,
    latestFailedNotification: fail ? { error: fail.error } : null,
    hasRecentNoMatchAudit: Boolean(noMatchAudits && noMatchAudits.length > 0),
    resolutionStatus: (slotRow.resolution_status as string | null) ?? "none",
  });

  return { slot: slotRow, signals };
}
