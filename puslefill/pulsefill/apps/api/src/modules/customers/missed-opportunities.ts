import type { SupabaseClient } from "@supabase/supabase-js";
import { guidanceForReason } from "./missed-opportunity-guidance.js";

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

export async function fetchMissedOpportunities(
  admin: SupabaseClient,
  customerId: string,
): Promise<Record<string, unknown>> {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data: expiredOffers } = await admin
    .from("slot_offers")
    .select(
      `
      id,
      status,
      expires_at,
      sent_at,
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
    .in("status", ["expired", "failed", "cancelled"])
    .gte("expires_at", since)
    .order("expires_at", { ascending: false })
    .limit(40);

  const { data: lostClaims } = await admin
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
    .eq("status", "lost")
    .gte("claimed_at", since)
    .order("claimed_at", { ascending: false })
    .limit(40);

  const items: Array<Record<string, unknown>> = [];
  const seenSlots = new Set<string>();

  const pushItem = async (
    id: string,
    reasonCode: string,
    reasonTitle: string,
    reasonDetail: string,
    missedAt: string,
    offerId: string | null,
    claimId: string | null,
    slot: Record<string, unknown>,
  ) => {
    const sid = String(slot.id ?? "");
    if (seenSlots.has(sid)) return;
    seenSlots.add(sid);
    const labels = await slotLabels(admin, slot);
    const guidance = guidanceForReason(reasonCode);
    items.push({
      id,
      open_slot_id: sid,
      offer_id: offerId,
      claim_id: claimId,
      business_name: labels.business_name,
      service_name: labels.service_name,
      location_name: labels.location_name,
      provider_name: labels.provider_name,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      missed_at: missedAt,
      reason_code: reasonCode,
      reason_title: reasonTitle,
      reason_detail: reasonDetail,
      guidance,
    });
  };

  for (const raw of expiredOffers ?? []) {
    const o = raw as Record<string, unknown>;
    const slot = (Array.isArray(o.open_slots) ? o.open_slots[0] : o.open_slots) as Record<string, unknown> | null;
    if (!slot) continue;
    const slotSt = String(slot.status ?? "");
    const reasonCode =
      slotSt === "booked" || slotSt === "claimed" ? "claimed_by_someone_else" : "expired_before_action";
    const reasonTitle =
      reasonCode === "claimed_by_someone_else" ? "Claimed by another customer" : "Offer expired before you claimed";
    const reasonDetail =
      reasonCode === "claimed_by_someone_else"
        ? "This opening was taken before you could claim it."
        : "This offer timed out before a claim went through.";
    await pushItem(
      `missed_offer_${String(o.id)}`,
      reasonCode,
      reasonTitle,
      reasonDetail,
      String(o.expires_at ?? o.sent_at),
      String(o.id),
      null,
      slot,
    );
  }

  for (const raw of lostClaims ?? []) {
    const c = raw as Record<string, unknown>;
    const slot = (Array.isArray(c.open_slots) ? c.open_slots[0] : c.open_slots) as Record<string, unknown> | null;
    if (!slot) continue;
    await pushItem(
      `missed_claim_${String(c.id)}`,
      "claimed_by_someone_else",
      "Claimed by another customer",
      "Another customer won this opening.",
      String(c.claimed_at),
      null,
      String(c.id),
      slot,
    );
  }

  items.sort((a, b) => String(b.missed_at).localeCompare(String(a.missed_at)));

  const reasonCounts = new Map<string, number>();
  for (const it of items) {
    const rc = String(it.reason_code ?? "unknown");
    reasonCounts.set(rc, (reasonCounts.get(rc) ?? 0) + 1);
  }
  let topReason: string | null = null;
  let topN = 0;
  for (const [k, v] of reasonCounts) {
    if (v > topN) {
      topN = v;
      topReason = k;
    }
  }

  const summary = {
    missed_last_7_days: items.length,
    top_reason: topReason,
    notifications_likely_helped: items.some((i) => String(i.reason_code) !== "preference_inactive"),
  };

  return { summary, items: items.slice(0, 50) };
}
