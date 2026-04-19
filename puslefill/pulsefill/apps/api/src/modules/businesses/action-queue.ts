import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionQueueKind =
  | "awaiting_confirmation"
  | "delivery_failed"
  | "retry_recommended"
  | "no_matches"
  | "offered_active"
  | "expired_unfilled"
  | "confirmed_booking";

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
  provider_name_snapshot: string | null;
  provider_id: string | null;
  service_id: string | null;
  location_id: string | null;
  /** PostgREST may return object or single-element array for FK joins */
  providers: unknown;
  services: unknown;
  locations: unknown;
};

function pickJoinedName(rel: unknown): string | null {
  if (!rel) return null;
  const o = Array.isArray(rel) ? rel[0] : rel;
  if (o && typeof o === "object" && "name" in o && typeof (o as { name: unknown }).name === "string") {
    const n = (o as { name: string }).name.trim();
    return n || null;
  }
  return null;
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
    { data: wonClaims },
    { data: failedLogs },
    { data: allOffers },
    { data: noMatchAudits },
  ] = await Promise.all([
    activeIds.length
      ? admin
          .from("slot_claims")
          .select("id, open_slot_id, customer_id, claimed_at, status")
          .in("open_slot_id", activeIds)
          .eq("status", "won")
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

  const wonBySlot = new Map((wonClaims ?? []).map((c) => [c.open_slot_id, c]));
  type FailedLogRow = { open_slot_id: string | null; status: string; error: string | null; created_at: string };
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
  const customerIds = new Set<string>();
  for (const c of wonClaims ?? []) customerIds.add(c.customer_id);

  const { data: customers } =
    customerIds.size > 0
      ? await admin
          .from("customers")
          .select("id, full_name, email, phone")
          .in("id", [...customerIds])
      : { data: [] };
  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));

  const needsAction: ActionQueueItem[] = [];
  const review: ActionQueueItem[] = [];
  const resolved: ActionQueueItem[] = [];

  const usedInNeeds = new Set<string>();

  function pushNeeds(item: ActionQueueItem) {
    if (usedInNeeds.has(item.open_slot_id)) return;
    usedInNeeds.add(item.open_slot_id);
    needsAction.push(item);
  }

  // 1) Awaiting confirmation
  for (const slot of activeSlots ?? []) {
    const s = slot as unknown as SlotRow;
    if (s.status !== "claimed") continue;
    const claim = wonBySlot.get(s.id);
    if (!claim) continue;
    const cust = customerById.get(claim.customer_id);
    pushNeeds({
      id: `awaiting-${s.id}`,
      kind: "awaiting_confirmation",
      severity: "high",
      headline: "Confirm the booking",
      description: "A customer claimed this opening. Confirm to finalize the slot.",
      open_slot_id: s.id,
      slot_status: s.status,
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: customerLabel(claim.customer_id, cust),
      claim_id: claim.id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: ["confirm_booking", "open_slot"],
    });
  }

  // 2) Delivery failed (notification_logs)
  for (const slot of activeSlots ?? []) {
    const s = slot as unknown as SlotRow;
    if (!failedBySlot.has(s.id)) continue;
    if (usedInNeeds.has(s.id)) continue;
    const log = failedBySlot.get(s.id)!;
    pushNeeds({
      id: `delivery-failed-${s.id}`,
      kind: "delivery_failed",
      severity: "high",
      headline: "Notification delivery failed",
      description: log.error
        ? `Last failure: ${log.error.slice(0, 160)}${log.error.length > 160 ? "…" : ""}`
        : "At least one offer notification failed. Inspect logs and retry if needed.",
      open_slot_id: s.id,
      slot_status: s.status,
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: null,
      claim_id: null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: ["inspect_logs", "open_slot"],
    });
  }

  // 3) Retry recommended: active slot with failed offers still recoverable
  for (const slot of activeSlots ?? []) {
    const s = slot as unknown as SlotRow;
    if (s.status !== "open" && s.status !== "offered") continue;
    if (usedInNeeds.has(s.id)) continue;
    const offers = offersBySlot.get(s.id) ?? [];
    const hasFailedOffer = offers.some((o) => o.status === "failed");
    if (!hasFailedOffer) continue;
    pushNeeds({
      id: `retry-${s.id}`,
      kind: "retry_recommended",
      severity: "medium",
      headline: "Retry offers",
      description: "One or more offers failed. Open the slot to resend or adjust.",
      open_slot_id: s.id,
      slot_status: s.status,
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: null,
      claim_id: null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: ["retry_offers", "open_slot"],
    });
  }

  const usedInReview = new Set<string>();
  function pushReview(item: ActionQueueItem) {
    if (usedInNeeds.has(item.open_slot_id)) return;
    if (usedInReview.has(item.open_slot_id)) return;
    usedInReview.add(item.open_slot_id);
    review.push(item);
  }

  // Review: no matches (audit), slot still open
  const openIds = new Set((activeSlots ?? []).filter((x) => x.status === "open").map((x) => x.id));
  for (const ev of noMatchAudits ?? []) {
    const eid = ev.entity_id as string | null;
    if (!eid || !openIds.has(eid)) continue;
    const s = slotById.get(eid);
    if (!s) continue;
    pushReview({
      id: `no-match-${s.id}`,
      kind: "no_matches",
      severity: "low",
      headline: "No standby matches",
      description: "Last send found zero matching customers. Widen standby or adjust the slot.",
      open_slot_id: s.id,
      slot_status: s.status,
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: null,
      claim_id: null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: ["retry_offers", "open_slot"],
    });
  }

  // Review: offered with live offers
  for (const slot of activeSlots ?? []) {
    const s = slot as unknown as SlotRow;
    if (s.status !== "offered") continue;
    const offers = offersBySlot.get(s.id) ?? [];
    const hasLive = offers.some((o) => {
      if (!["sent", "delivered", "viewed"].includes(o.status)) return false;
      return new Date(o.expires_at).getTime() > now;
    });
    if (!hasLive) continue;
    pushReview({
      id: `offered-${s.id}`,
      kind: "offered_active",
      severity: "low",
      headline: "Offers out",
      description: "Customers have active offers for this slot. Watch for claims.",
      open_slot_id: s.id,
      slot_status: s.status,
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: null,
      claim_id: null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: ["view_slot", "open_slot"],
    });
  }

  // Review: expired unfilled
  for (const slot of expiredSlots ?? []) {
    const s = slot as unknown as SlotRow;
    pushReview({
      id: `expired-${s.id}`,
      kind: "expired_unfilled",
      severity: "low",
      headline: "Slot expired unfilled",
      description: "This opening closed without a booking. Review if you want to recreate.",
      open_slot_id: s.id,
      slot_status: s.status,
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: null,
      claim_id: null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: ["view_slot", "open_slot"],
    });
  }

  // Resolved: recently booked
  for (const slot of bookedSlots ?? []) {
    const s = slot as unknown as SlotRow;
    resolved.push({
      id: `booked-${s.id}`,
      kind: "confirmed_booking",
      severity: "low",
      headline: "Booking recovered",
      description: "This slot was confirmed and marked booked.",
      open_slot_id: s.id,
      slot_status: s.status,
      provider_name: providerLabel(s),
      service_name: serviceLabel(s),
      location_name: locationLabel(s),
      customer_label: null,
      claim_id: null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      created_at: s.created_at,
      actions: ["view_slot"],
    });
  }

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
