import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerEventKind } from "./customer-event-taxonomy.js";
import { getCustomerEventCopy } from "./customer-event-copy.js";

type FeedItem = {
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

export async function fetchCustomerActivityFeed(
  admin: SupabaseClient,
  customerId: string,
): Promise<{ items: FeedItem[] } | { error: string }> {
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

  if (oErr) return { error: "offers_failed" };

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

  if (cErr) return { error: "claims_failed" };

  const items: FeedItem[] = [];

  for (const raw of offers ?? []) {
    const o = raw as Record<string, unknown>;
    const slot = (Array.isArray(o.open_slots) ? o.open_slots[0] : o.open_slots) as Record<string, unknown> | null;
    if (!slot) continue;
    const labels = await slotLabels(admin, slot);
    const st = String(o.status ?? "");
    const isExpired = st === "expired" || st === "failed" || st === "cancelled";
    const kind: CustomerEventKind = isExpired ? "offer_expired" : "offer_received";
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

  for (const raw of claims ?? []) {
    const c = raw as Record<string, unknown>;
    const slot = (Array.isArray(c.open_slots) ? c.open_slots[0] : c.open_slots) as Record<string, unknown> | null;
    if (!slot) continue;
    const labels = await slotLabels(admin, slot);
    const cs = String(c.status ?? "");
    const ss = String(slot.status ?? "");

    let kind: CustomerEventKind = "claim_submitted";
    if (cs === "confirmed" && ss === "booked") kind = "booking_confirmed";
    else if (cs === "won" && ss === "claimed") kind = "claim_pending_confirmation";
    else if (cs === "lost" || cs === "failed") kind = "claim_unavailable";
    else if (cs === "won") kind = "claim_pending_confirmation";

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

  items.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));

  return { items: items.slice(0, 100) };
}
