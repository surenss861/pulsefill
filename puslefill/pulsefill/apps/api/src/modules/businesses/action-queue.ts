import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildAvailableActions,
  buildQueueContext,
  toSlotRuleSignals,
  type OperatorSlotAvailableAction,
  type QueueCategory,
} from "../slots/operator-slot-rules.js";

export type ActionQueueKind = QueueCategory;

export type ActionQueueSeverity = "high" | "medium" | "low";

export type ActionQueueAction = "confirm_booking" | "open_slot" | "inspect_logs" | "retry_offers" | "view_slot";

export type ActionQueueItem = {
  id: string;
  kind: ActionQueueKind;
  severity: ActionQueueSeverity;
  headline: string;
  description: string;
  open_slot_id: string;
  slot_status: string;
  provider_id: string | null;
  location_id: string | null;
  service_id: string | null;
  provider_name: string | null;
  service_name: string | null;
  location_name: string | null;
  customer_label: string | null;
  claim_id: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  actions: ActionQueueAction[];
};

export type ActionQueueSummary = {
  needs_action_count: number;
  review_count: number;
  resolved_count: number;
  awaiting_confirmation_count: number;
  delivery_failed_count: number;
  retry_recommended_count: number;
};

export type ActionQueueResponse = {
  summary: ActionQueueSummary;
  sections: {
    needs_action: ActionQueueItem[];
    review: ActionQueueItem[];
    resolved: ActionQueueItem[];
  };
};

type SlotRow = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  last_offer_batch_at: string | null;
  resolution_status: string | null;
  provider_name_snapshot: string | null;
  provider_id: string | null;
  service_id: string | null;
  location_id: string | null;
  /** PostgREST may return object or single-element array for FK joins */
  providers: unknown;
  services: unknown;
  locations: unknown;
};

type ClaimRow = {
  id: string;
  open_slot_id: string;
  customer_id: string;
  claimed_at: string;
  status: string;
};

type FailedLogRow = { open_slot_id: string | null; status: string; error: string | null; created_at: string };

const NEEDS_ACTION_ORDER: Partial<Record<QueueCategory, number>> = {
  awaiting_confirmation: 0,
  delivery_failed: 1,
  retry_recommended: 2,
  no_matches: 3,
};

const REVIEW_CATEGORY_ORDER: Partial<Record<QueueCategory, number>> = {
  offered_active: 0,
  expired_unfilled: 1,
};

function mapOperatorActionsToQueueRowActions(
  actions: OperatorSlotAvailableAction[],
  category: QueueCategory | null,
): ActionQueueAction[] {
  const out: ActionQueueAction[] = [];
  if (actions.includes("confirm_booking")) out.push("confirm_booking");
  if (actions.includes("retry_offers") || actions.includes("send_offers")) out.push("retry_offers");
  if (actions.includes("inspect_notification_logs")) out.push("inspect_logs");
  if (
    category === "offered_active" &&
    !actions.includes("retry_offers") &&
    !actions.includes("send_offers")
  ) {
    out.push("view_slot");
  }
  if (category === "expired_unfilled" || category === "confirmed_booking") {
    if (!out.includes("view_slot") && !out.includes("retry_offers")) out.push("view_slot");
  }
  if (!out.includes("open_slot")) out.push("open_slot");
  const order: ActionQueueAction[] = ["confirm_booking", "retry_offers", "inspect_logs", "view_slot", "open_slot"];
  const seen = new Set<ActionQueueAction>();
  const ordered: ActionQueueAction[] = [];
  for (const k of order) {
    if (out.includes(k) && !seen.has(k)) {
      seen.add(k);
      ordered.push(k);
    }
  }
  return ordered;
}

function pickJoinedName(rel: unknown): string | null {
  if (!rel) return null;
  const o = Array.isArray(rel) ? rel[0] : rel;
  if (o && typeof o === "object" && "name" in o && typeof (o as { name: unknown }).name === "string") {
    const n = (o as { name: string }).name.trim();
    return n || null;
  }
  return null;
}

function slotDimensions(s: SlotRow) {
  return {
    provider_id: s.provider_id ?? null,
    location_id: s.location_id ?? null,
    service_id: s.service_id ?? null,
  };
}

function shortId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function customerLabel(
  id: string,
  profile?: { full_name: string | null; email: string | null; phone: string | null } | null,
): string {
  if (profile?.full_name?.trim()) return profile.full_name.trim();
  const em = profile?.email?.trim();
  if (em) {
    const at = em.indexOf("@");
    if (at > 0) return `${em.slice(0, 2)}…@${em.slice(at + 1)}`;
  }
  const ph = profile?.phone?.trim();
  if (ph) {
    const d = ph.replace(/\D/g, "");
    if (d.length >= 4) return `…${d.slice(-4)}`;
  }
  return shortId(id);
}

function providerLabel(s: SlotRow): string | null {
  return pickJoinedName(s.providers) || s.provider_name_snapshot?.trim() || null;
}

function serviceLabel(s: SlotRow): string | null {
  return pickJoinedName(s.services);
}

function locationLabel(s: SlotRow): string | null {
  return pickJoinedName(s.locations);
}

export async function buildActionQueue(admin: SupabaseClient, businessId: string): Promise<ActionQueueResponse> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const resolvedSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const slotSelect = `
    id,
    status,
    starts_at,
    ends_at,
    created_at,
    last_offer_batch_at,
    resolution_status,
    provider_name_snapshot,
    provider_id,
    service_id,
    location_id,
    providers ( name ),
    services ( name ),
    locations ( name )
  `;

  const [{ data: activeSlots, error: activeErr }, { data: expiredSlots, error: expErr }, { data: bookedSlots, error: bookErr }] =
    await Promise.all([
      admin
        .from("open_slots")
        .select(slotSelect)
        .eq("business_id", businessId)
        .in("status", ["claimed", "open", "offered"])
        .order("starts_at", { ascending: true })
        .limit(200),
      admin
        .from("open_slots")
        .select(slotSelect)
        .eq("business_id", businessId)
        .eq("status", "expired")
        .gte("created_at", since)
        .order("ends_at", { ascending: false })
        .limit(40),
      admin
        .from("open_slots")
        .select(slotSelect)
        .eq("business_id", businessId)
        .eq("status", "booked")
        .gte("created_at", resolvedSince)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  if (activeErr || expErr || bookErr) {
    throw new Error("action_queue_slot_load_failed");
  }

  const slots = [...(activeSlots ?? []), ...(expiredSlots ?? [])] as unknown as SlotRow[];
  const slotById = new Map(slots.map((s) => [s.id, s]));
  for (const s of bookedSlots ?? []) {
    slotById.set(s.id, s as unknown as SlotRow);
  }

  const activeIds = (activeSlots ?? []).map((s) => s.id);

  const [
    { data: slotClaims },
    { data: failedLogs },
    { data: allOffers },
    { data: noMatchAudits },
  ] = await Promise.all([
    activeIds.length
      ? admin
          .from("slot_claims")
          .select("id, open_slot_id, customer_id, claimed_at, status")
          .in("open_slot_id", activeIds)
          .in("status", ["won", "pending"])
      : { data: [] },
    activeIds.length
      ? admin
          .from("notification_logs")
          .select("open_slot_id, status, error, created_at")
          .in("open_slot_id", activeIds)
          .eq("status", "failed")
          .order("created_at", { ascending: false })
      : { data: [] },
    activeIds.length
      ? admin.from("slot_offers").select("open_slot_id, status, expires_at").in("open_slot_id", activeIds)
      : { data: [] },
    admin
      .from("audit_events")
      .select("entity_id, created_at")
      .eq("business_id", businessId)
      .eq("event_type", "offers_no_match")
      .eq("entity_type", "open_slot")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const claimsBySlot = new Map<string, ClaimRow[]>();
  for (const c of slotClaims ?? []) {
    const row = c as ClaimRow;
    const list = claimsBySlot.get(row.open_slot_id) ?? [];
    list.push(row);
    claimsBySlot.set(row.open_slot_id, list);
  }

  const failedBySlot = new Map<string, FailedLogRow>();
  for (const row of failedLogs ?? []) {
    const r = row as FailedLogRow;
    if (!r.open_slot_id) continue;
    if (!failedBySlot.has(r.open_slot_id)) failedBySlot.set(r.open_slot_id, r);
  }

  const offersBySlot = new Map<string, Array<{ status: string; expires_at: string }>>();
  for (const o of allOffers ?? []) {
    const list = offersBySlot.get(o.open_slot_id) ?? [];
    list.push({ status: o.status, expires_at: o.expires_at });
    offersBySlot.set(o.open_slot_id, list);
  }

  const now = Date.now();

  const noMatchIds = new Set<string>();
  for (const ev of noMatchAudits ?? []) {
    const eid = ev.entity_id as string | null;
    if (!eid) continue;
    const s = slotById.get(eid);
    if (s && (s.status === "open" || s.status === "offered")) {
      noMatchIds.add(eid);
    }
  }

  const customerIds = new Set<string>();
  for (const slot of activeSlots ?? []) {
    const s = slot as unknown as SlotRow;
    if (s.status !== "claimed") continue;
    const claims = claimsBySlot.get(s.id) ?? [];
    const primary = claims.find((c) => c.status === "won") ?? claims.find((c) => c.status === "pending");
    if (primary) customerIds.add(primary.customer_id);
  }

  const { data: customers } =
    customerIds.size > 0
      ? await admin
          .from("customers")
          .select("id, full_name, email, phone")
          .in("id", [...customerIds])
      : { data: [] };
  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));

  function actionQueueEntry(
    s: SlotRow,
    claimRows: ClaimRow[],
  ): { item: ActionQueueItem; section: "needs_action" | "review" | "resolved" } | null {
    const offers = offersBySlot.get(s.id) ?? [];
    const failed = failedBySlot.get(s.id);
    const signals = toSlotRuleSignals({
      slotStatus: s.status,
      createdAt: s.created_at,
      nowMs: now,
      offers,
      claims: claimRows.map((c) => ({ status: c.status })),
      lastOfferBatchAt: s.last_offer_batch_at,
      latestFailedNotification: failed ? { error: failed.error } : null,
      hasRecentNoMatchAudit: noMatchIds.has(s.id),
      resolutionStatus: s.resolution_status ?? "none",
    });
    const ctx = buildQueueContext(signals);
    if (!ctx.current_category || !ctx.current_section) return null;

    const primaryClaim =
      claimRows.find((c) => c.status === "won") ?? claimRows.find((c) => c.status === "pending");
    const cust = primaryClaim ? customerById.get(primaryClaim.customer_id) : undefined;
    const awaiting = ctx.current_category === "awaiting_confirmation";

    const operatorActions = buildAvailableActions(signals, ctx);
    const rowActions = mapOperatorActionsToQueueRowActions(operatorActions, ctx.current_category);

    const item: ActionQueueItem = {
      id: `${ctx.current_category}-${s.id}`,
      kind: ctx.current_category,
      severity: ctx.severity ?? "low",
      headline: ctx.reason_title ?? "",
      description: ctx.reason_detail ?? "",
      open_slot_id: s.id,
      slot_status: s.status,
      ...slotDimensions(s),
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: awaiting && primaryClaim ? customerLabel(primaryClaim.customer_id, cust) : null,
      claim_id: awaiting && primaryClaim ? primaryClaim.id : null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: rowActions,
    };
    return { item, section: ctx.current_section };
  }

  const needsAction: ActionQueueItem[] = [];
  const review: ActionQueueItem[] = [];
  const resolved: ActionQueueItem[] = [];

  const buckets: Array<{ slot: SlotRow; item: ActionQueueItem; section: "needs_action" | "review" | "resolved" }> = [];

  for (const slot of activeSlots ?? []) {
    const s = slot as unknown as SlotRow;
    const entry = actionQueueEntry(s, claimsBySlot.get(s.id) ?? []);
    if (!entry) continue;
    buckets.push({ slot: s, item: entry.item, section: entry.section });
  }

  for (const slot of expiredSlots ?? []) {
    const s = slot as unknown as SlotRow;
    const entry = actionQueueEntry(s, []);
    if (!entry) continue;
    buckets.push({ slot: s, item: entry.item, section: entry.section });
  }

  for (const slot of bookedSlots ?? []) {
    const s = slot as unknown as SlotRow;
    const entry = actionQueueEntry(s, []);
    if (!entry) continue;
    buckets.push({ slot: s, item: entry.item, section: entry.section });
  }

  function sortKey(section: "needs_action" | "review" | "resolved", slot: SlotRow, kind: QueueCategory): number[] {
    if (section === "needs_action") {
      return [NEEDS_ACTION_ORDER[kind] ?? 99, new Date(slot.starts_at).getTime()];
    }
    if (section === "review") {
      return [REVIEW_CATEGORY_ORDER[kind] ?? 99, new Date(slot.ends_at).getTime() * -1];
    }
    return [new Date(slot.created_at).getTime() * -1];
  }

  for (const b of buckets) {
    if (b.section === "needs_action") needsAction.push(b.item);
    else if (b.section === "review") review.push(b.item);
    else resolved.push(b.item);
  }

  const sortItems = (arr: ActionQueueItem[], section: "needs_action" | "review" | "resolved") => {
    arr.sort((a, b) => {
      const sa = slotById.get(a.open_slot_id) as SlotRow | undefined;
      const sb = slotById.get(b.open_slot_id) as SlotRow | undefined;
      if (!sa || !sb) return 0;
      const ka = sortKey(section, sa, a.kind);
      const kb = sortKey(section, sb, b.kind);
      for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
        const da = ka[i] ?? 0;
        const db = kb[i] ?? 0;
        if (da !== db) return da - db;
      }
      return 0;
    });
  };

  sortItems(needsAction, "needs_action");
  sortItems(review, "review");
  sortItems(resolved, "resolved");

  const awaiting_confirmation_count = needsAction.filter((i) => i.kind === "awaiting_confirmation").length;
  const delivery_failed_count = needsAction.filter((i) => i.kind === "delivery_failed").length;
  const retry_recommended_count = needsAction.filter((i) => i.kind === "retry_recommended").length;

  return {
    summary: {
      needs_action_count: needsAction.length,
      review_count: review.length,
      resolved_count: resolved.length,
      awaiting_confirmation_count,
      delivery_failed_count,
      retry_recommended_count,
    },
    sections: {
      needs_action: needsAction,
      review,
      resolved,
    },
  };
}
