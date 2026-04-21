import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerEventKind } from "./customer-event-taxonomy.js";
import {
  buildStandbyReadinessInputFromLoaded,
  computeCustomerStandbyReadiness,
  fetchCustomerStandbyPrereqs,
  latestStandbyTouchIso,
} from "./customer-standby-readiness.js";
import { getCustomerEventCopy } from "./customer-event-copy.js";

export type FeedItem = {
  id: string;
  kind: CustomerEventKind;
  title: string;
  detail: string | null;
  occurred_at: string;
  state: string | null;
  offer_id: string | null;
  claim_id: string | null;
  open_slot_id: string | null;
  business_name: string | null;
  service_name: string | null;
  provider_name: string | null;
  location_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export type FetchCustomerActivityFeedOpts = {
  pushPermissionStatus?: string;
};

async function slotLabels(
  admin: SupabaseClient,
  slot: Record<string, unknown>,
): Promise<{ business_name: string | null; service_name: string | null; location_name: string | null; provider_name: string | null }> {
  const bid = slot.business_id as string | undefined;
  const lid = slot.location_id as string | undefined;
  const sid = slot.service_id as string | undefined;
  const pid = slot.provider_id as string | undefined;
  const [b, l, s, p] = await Promise.all([
    bid ? admin.from("businesses").select("name").eq("id", bid).maybeSingle() : { data: null },
    lid ? admin.from("locations").select("name").eq("id", lid).maybeSingle() : { data: null },
    sid ? admin.from("services").select("name").eq("id", sid).maybeSingle() : { data: null },
    pid ? admin.from("providers").select("name").eq("id", pid).maybeSingle() : { data: null },
  ]);
  return {
    business_name: (b.data as { name?: string } | null)?.name ?? null,
    location_name: (l.data as { name?: string } | null)?.name ?? null,
    service_name: (s.data as { name?: string } | null)?.name ?? null,
    provider_name:
      (p.data as { name?: string } | null)?.name ?? (slot.provider_name_snapshot as string | null) ?? null,
  };
}

async function buildOfferActivity(
  admin: SupabaseClient,
  customerId: string,
): Promise<FeedItem[]> {
  const { data: offers, error: oErr } = await admin
    .from("slot_offers")
    .select(
      `
      id,
      status,
      sent_at,
      expires_at,
      open_slot_id,
      open_slots (
        id,
        business_id,
        location_id,
        provider_id,
        service_id,
        provider_name_snapshot,
        starts_at,
        ends_at,
        status
      )
    `,
    )
    .eq("customer_id", customerId)
    .order("sent_at", { ascending: false })
    .limit(80);

  if (oErr) throw new Error("offers_failed");

  const items: FeedItem[] = [];
  for (const raw of offers ?? []) {
    const o = raw as Record<string, unknown>;
    const slot = (Array.isArray(o.open_slots) ? o.open_slots[0] : o.open_slots) as Record<string, unknown> | null;
    if (!slot) continue;
    const labels = await slotLabels(admin, slot);
    const st = String(o.status ?? "");
    const kind: CustomerEventKind = offerRowStatusToFeedKind(st);
    const copy = getCustomerEventCopy({
      kind,
      businessName: labels.business_name,
      serviceName: labels.service_name,
      startsAt: slot.starts_at as string,
    });
    items.push({
      id: `offer_${String(o.id)}`,
      kind,
      title: copy.title,
      detail: copy.detail ?? null,
      occurred_at: String(o.sent_at ?? new Date().toISOString()),
      state: st,
      offer_id: String(o.id),
      claim_id: null,
      open_slot_id: String(o.open_slot_id ?? slot.id),
      business_name: labels.business_name,
      service_name: labels.service_name,
      provider_name: labels.provider_name,
      location_name: labels.location_name,
      starts_at: slot.starts_at as string,
      ends_at: slot.ends_at as string,
    });
  }
  return items;
}

/** Pure mapping used when building claim rows (exported for tests). */
export function claimStatusToEventKind(claimStatus: string, slotStatus: string): CustomerEventKind {
  const cs = String(claimStatus ?? "");
  const ss = String(slotStatus ?? "");
  if (cs === "confirmed" && ss === "booked") return "booking_confirmed";
  if (cs === "won" && ss === "claimed") return "claim_pending_confirmation";
  if (cs === "lost" || cs === "failed") return "missed_opportunity";
  if (cs === "won") return "claim_pending_confirmation";
  return "claim_submitted";
}

/** Pure mapping for offer row status → feed kind (exported for tests). */
export function offerRowStatusToFeedKind(status: string): "offer_received" | "offer_expired" {
  const st = String(status ?? "");
  const isExpired = st === "expired" || st === "failed" || st === "cancelled";
  return isExpired ? "offer_expired" : "offer_received";
}

async function buildClaimActivity(admin: SupabaseClient, customerId: string): Promise<FeedItem[]> {
  const { data: claims, error: cErr } = await admin
    .from("slot_claims")
    .select(
      `
      id,
      status,
      claimed_at,
      open_slot_id,
      open_slots (
        id,
        business_id,
        location_id,
        provider_id,
        service_id,
        provider_name_snapshot,
        starts_at,
        ends_at,
        status
      )
    `,
    )
    .eq("customer_id", customerId)
    .order("claimed_at", { ascending: false })
    .limit(80);

  if (cErr) throw new Error("claims_failed");

  const items: FeedItem[] = [];
  for (const raw of claims ?? []) {
    const c = raw as Record<string, unknown>;
    const slot = (Array.isArray(c.open_slots) ? c.open_slots[0] : c.open_slots) as Record<string, unknown> | null;
    if (!slot) continue;
    const labels = await slotLabels(admin, slot);
    const cs = String(c.status ?? "");
    const ss = String(slot.status ?? "");
    const kind = claimStatusToEventKind(cs, ss);

    const copy = getCustomerEventCopy({
      kind,
      businessName: labels.business_name,
      serviceName: labels.service_name,
      startsAt: slot.starts_at as string,
    });

    const { data: offerRow } = await admin
      .from("slot_offers")
      .select("id")
      .eq("open_slot_id", String(c.open_slot_id))
      .eq("customer_id", customerId)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const linkedOfferId = offerRow && typeof (offerRow as { id?: string }).id === "string" ? String((offerRow as { id: string }).id) : null;

    items.push({
      id: `claim_${String(c.id)}`,
      kind,
      title: copy.title,
      detail: copy.detail ?? null,
      occurred_at: String(c.claimed_at ?? new Date().toISOString()),
      state: cs,
      offer_id: linkedOfferId,
      claim_id: String(c.id),
      open_slot_id: String(c.open_slot_id ?? slot.id),
      business_name: labels.business_name,
      service_name: labels.service_name,
      provider_name: labels.provider_name,
      location_name: labels.location_name,
      starts_at: slot.starts_at as string,
      ends_at: slot.ends_at as string,
    });
  }
  return items;
}

export function appendStandbySystemRows(
  readiness: ReturnType<typeof computeCustomerStandbyReadiness>,
  touchIso: string,
): FeedItem[] {
  const out: FeedItem[] = [];
  if (readiness.shouldSuggestSetup) {
    const copy = getCustomerEventCopy({ kind: "standby_setup_suggestion" });
    out.push({
      id: "system_standby_setup_suggestion",
      kind: "standby_setup_suggestion",
      title: copy.title,
      detail: copy.detail ?? null,
      occurred_at: touchIso,
      state: null,
      offer_id: null,
      claim_id: null,
      open_slot_id: null,
      business_name: null,
      service_name: null,
      provider_name: null,
      location_name: null,
      starts_at: null,
      ends_at: null,
    });
  }
  if (readiness.shouldRemindStatus) {
    const copy = getCustomerEventCopy({ kind: "standby_status_reminder" });
    out.push({
      id: "system_standby_status_reminder",
      kind: "standby_status_reminder",
      title: copy.title,
      detail: copy.detail ?? null,
      occurred_at: touchIso,
      state: null,
      offer_id: null,
      claim_id: null,
      open_slot_id: null,
      business_name: null,
      service_name: null,
      provider_name: null,
      location_name: null,
      starts_at: null,
      ends_at: null,
    });
  }
  return out;
}

export function dedupeAndSort(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  const out: FeedItem[] = [];
  for (const it of items) {
    const key = `${it.kind}|${it.offer_id ?? ""}|${it.claim_id ?? ""}|${it.open_slot_id ?? ""}|${it.occurred_at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  out.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
  return out;
}

export async function fetchCustomerActivityFeed(
  admin: SupabaseClient,
  customerId: string,
  opts: FetchCustomerActivityFeedOpts = {},
): Promise<{ items: FeedItem[] } | { error: string }> {
  const pushPermissionStatus = opts.pushPermissionStatus ?? "unknown";

  try {
    const [offerItems, claimItems, prereqs] = await Promise.all([
      buildOfferActivity(admin, customerId),
      buildClaimActivity(admin, customerId),
      fetchCustomerStandbyPrereqs(admin, customerId),
    ]);

    const input = buildStandbyReadinessInputFromLoaded({
      customer: prereqs.customer,
      prefRows: prereqs.prefRows,
      pushDeviceCount: prereqs.pushDeviceCount,
      pushPermissionStatus,
    });
    const readiness = computeCustomerStandbyReadiness(input);
    const touchIso = latestStandbyTouchIso({
      prefRows: prereqs.prefRows,
      notificationPrefsUpdatedAt: prereqs.notificationPrefsUpdatedAt,
      customerCreatedAt: prereqs.customer?.created_at ?? null,
    });
    const systemItems = appendStandbySystemRows(readiness, touchIso);

    const merged = dedupeAndSort([...offerItems, ...claimItems, ...systemItems]);
    return { items: merged.slice(0, 100) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "offers_failed" || msg === "claims_failed") return { error: msg };
    return { error: "activity_feed_failed" };
  }
}
