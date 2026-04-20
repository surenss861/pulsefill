import type { SupabaseClient } from "@supabase/supabase-js";

export type OperatorActivityKind =
  | "offers_sent"
  | "offers_retry_sent"
  | "delivery_failed"
  | "offers_no_match"
  | "claim_received"
  | "booking_confirmed"
  | "slot_expired"
  | "slot_cancelled"
  | "internal_note_updated"
  | "recovery_feedback_added";

export type OperatorActivityRowAction = "retry_now" | "add_note" | "add_feedback" | "open_detail";

export type OperatorActivityBulkActionType = "retry_offers" | "feedback";

export type OperatorActivityItem = {
  id: string;
  kind: OperatorActivityKind;
  title: string;
  detail?: string | null;
  occurred_at: string;
  open_slot_id?: string | null;
  slot_status?: string | null;
  business_name?: string | null;
  service_name?: string | null;
  provider_name?: string | null;
  location_name?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  priority_band?: "high" | "medium" | "low" | null;
  priority_summary?: string | null;
  recovery_recommendation_title?: string | null;
  recovery_recommendation_kind?: string | null;
  latest_delivery_outcome?: "delivered" | "failed" | "suppressed" | "skipped_no_channel" | null;
  latest_delivery_reason?: string | null;
  latest_feedback_value?: string | null;
  has_internal_note?: boolean | null;
  available_actions?: OperatorActivityRowAction[];
  bulk_selectable?: boolean;
  bulk_action_types?: OperatorActivityBulkActionType[];
};

export type OperatorActivityFeedResponse = {
  items: OperatorActivityItem[];
};

type SlotLite = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  provider_name_snapshot: string | null;
  internal_note: string | null;
};

function mapAuditEventType(eventType: string): OperatorActivityKind | null {
  switch (eventType) {
    case "offers_sent":
      return "offers_sent";
    case "offers_no_match":
      return "offers_no_match";
    case "slot_expired":
      return "slot_expired";
    case "slot_cancelled":
      return "slot_cancelled";
    case "slot_confirmed":
      return "booking_confirmed";
    case "operator_internal_note_updated":
      return "internal_note_updated";
    default:
      return null;
  }
}

function auditTitle(kind: OperatorActivityKind): string {
  switch (kind) {
    case "offers_sent":
      return "Offers sent";
    case "offers_retry_sent":
      return "Retry sent";
    case "delivery_failed":
      return "Delivery failed";
    case "offers_no_match":
      return "No matches";
    case "claim_received":
      return "Claim received";
    case "booking_confirmed":
      return "Booking confirmed";
    case "slot_expired":
      return "Slot expired";
    case "slot_cancelled":
      return "Slot cancelled";
    case "internal_note_updated":
      return "Internal note updated";
    case "recovery_feedback_added":
      return "Recovery feedback";
    default:
      return "Activity";
  }
}

function rowActionsAndBulk(args: {
  openSlotId: string | null;
  slot: SlotLite | null;
  kind: OperatorActivityKind;
}): Pick<
  OperatorActivityItem,
  "available_actions" | "bulk_selectable" | "bulk_action_types"
> {
  const { openSlotId, slot, kind } = args;
  if (!openSlotId) {
    return { bulk_selectable: false, bulk_action_types: [], available_actions: [] };
  }

  const status = slot?.status ?? null;
  const actions: OperatorActivityRowAction[] = ["open_detail", "add_note", "add_feedback"];
  const bulkTypes: OperatorActivityBulkActionType[] = [];

  const retryableSlot = status === "open" || status === "offered";
  const retryHeuristic =
    retryableSlot &&
    (kind === "offers_sent" ||
      kind === "delivery_failed" ||
      kind === "offers_no_match" ||
      kind === "offers_retry_sent");

  if (retryHeuristic) {
    actions.unshift("retry_now");
    bulkTypes.push("retry_offers");
  }

  return {
    bulk_selectable: true,
    bulk_action_types: bulkTypes,
    available_actions: Array.from(new Set(actions)),
  };
}

function enrichFromSlot(
  item: OperatorActivityItem,
  slot: SlotLite | null,
  businessName: string | null,
): OperatorActivityItem {
  if (!slot) return { ...item, business_name: businessName ?? item.business_name ?? null };
  return {
    ...item,
    slot_status: slot.status,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    provider_name: slot.provider_name_snapshot?.trim() || item.provider_name || null,
    business_name: businessName,
    has_internal_note: Boolean(slot.internal_note?.trim()),
  };
}

export async function buildOperatorActivityFeed(
  admin: SupabaseClient,
  businessId: string,
): Promise<OperatorActivityFeedResponse> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: business }, { data: audits }, { data: failedLogsRaw }] = await Promise.all([
    admin.from("businesses").select("name").eq("id", businessId).maybeSingle(),
    admin
      .from("audit_events")
      .select("id, event_type, entity_type, entity_id, metadata, created_at")
      .eq("business_id", businessId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("notification_logs")
      .select("id, open_slot_id, status, error, created_at")
      .eq("status", "failed")
      .not("open_slot_id", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const businessName = (business as { name?: string } | null)?.name?.trim() ?? null;

  const itemsDraft: OperatorActivityItem[] = [];

  for (const row of audits ?? []) {
    const r = row as {
      id: string;
      event_type: string;
      entity_type: string;
      entity_id: string | null;
      metadata: Record<string, unknown>;
      created_at: string;
    };
    const kind = mapAuditEventType(r.event_type);
    if (!kind) continue;

    const openSlotId =
      r.entity_type === "open_slot" && r.entity_id && typeof r.entity_id === "string" ? r.entity_id : null;

    const meta = r.metadata ?? {};
    const detailParts: string[] = [];
    if (typeof meta.offer_count === "number") detailParts.push(`${meta.offer_count} offers`);
    if (typeof meta.reason === "string" && meta.reason.trim()) detailParts.push(meta.reason.trim());

    itemsDraft.push({
      id: `audit:${r.id}`,
      kind,
      title: auditTitle(kind),
      detail: detailParts.length ? detailParts.join(" · ") : null,
      occurred_at: r.created_at,
      open_slot_id: openSlotId,
    });
  }

  const failedLogRows = (failedLogsRaw ?? []) as Array<{
    id: string;
    open_slot_id: string | null;
    error: string | null;
    created_at: string;
  }>;

  const failedSlotIds = [...new Set(failedLogRows.map((r) => r.open_slot_id).filter(Boolean))] as string[];
  const failedSlotBusiness = new Map<string, boolean>();
  if (failedSlotIds.length > 0) {
    const { data: slotBiz } = await admin.from("open_slots").select("id").eq("business_id", businessId).in("id", failedSlotIds);
    for (const s of slotBiz ?? []) {
      failedSlotBusiness.set((s as { id: string }).id, true);
    }
  }

  for (const r of failedLogRows) {
    const openSlotId = r.open_slot_id;
    if (!openSlotId || !failedSlotBusiness.has(openSlotId)) continue;

    itemsDraft.push({
      id: `notify:${r.id}`,
      kind: "delivery_failed",
      title: auditTitle("delivery_failed"),
      detail: r.error ? r.error.slice(0, 220) + (r.error.length > 220 ? "…" : "") : null,
      occurred_at: r.created_at,
      open_slot_id: openSlotId,
      latest_delivery_outcome: "failed",
      latest_delivery_reason: r.error,
    });
  }

  itemsDraft.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : a.occurred_at > b.occurred_at ? -1 : 0));

  const slotIds = new Set<string>();
  for (const it of itemsDraft) {
    if (it.open_slot_id) slotIds.add(it.open_slot_id);
  }

  const slotById = new Map<string, SlotLite>();
  if (slotIds.size > 0) {
    const { data: slots } = await admin
      .from("open_slots")
      .select("id,status,starts_at,ends_at,provider_name_snapshot,internal_note")
      .eq("business_id", businessId)
      .in("id", [...slotIds]);

    for (const s of slots ?? []) {
      slotById.set((s as SlotLite).id, s as SlotLite);
    }
  }

  const items: OperatorActivityItem[] = itemsDraft.slice(0, 250).map((it) => {
    const slot = it.open_slot_id ? slotById.get(it.open_slot_id) ?? null : null;
    const base = enrichFromSlot(it, slot, businessName);
    const flags = rowActionsAndBulk({
      openSlotId: base.open_slot_id ?? null,
      slot,
      kind: base.kind,
    });
    return { ...base, ...flags };
  });

  return { items };
}
