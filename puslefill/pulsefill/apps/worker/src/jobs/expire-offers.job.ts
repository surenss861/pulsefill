import type { SupabaseClient } from "@supabase/supabase-js";

type StaleOffer = {
  id: string;
  open_slot_id: string;
  status: string;
  expires_at: string | null;
};

export async function expireOffersJob(supabase: SupabaseClient) {
  const nowIso = new Date().toISOString();

  const { data: staleOffers, error: staleError } = await supabase
    .from("slot_offers")
    .select("id, open_slot_id, status, expires_at")
    .eq("status", "sent")
    .lt("expires_at", nowIso);

  if (staleError) {
    throw new Error(`Failed to load stale offers: ${staleError.message}`);
  }

  if (!staleOffers?.length) {
    return { expiredOffers: 0, reopenedSlots: 0, expiredSlots: 0 };
  }

  const offerIds = staleOffers.map((o) => o.id);
  const slotIds = [...new Set(staleOffers.map((o) => o.open_slot_id))];

  const { error: expireOffersError } = await supabase
    .from("slot_offers")
    .update({ status: "expired" })
    .in("id", offerIds);

  if (expireOffersError) {
    throw new Error(`Failed to expire offers: ${expireOffersError.message}`);
  }

  let reopenedSlots = 0;
  let expiredSlots = 0;

  for (const slotId of slotIds) {
    const { data: winningClaim, error: claimError } = await supabase
      .from("slot_claims")
      .select("id, status")
      .eq("open_slot_id", slotId)
      .in("status", ["won", "confirmed"])
      .maybeSingle();

    if (claimError) {
      throw new Error(`Failed to check winning claim: ${claimError.message}`);
    }

    if (winningClaim) continue;

    const { data: remainingLiveOffers, error: remainingError } = await supabase
      .from("slot_offers")
      .select("id")
      .eq("open_slot_id", slotId)
      .in("status", ["sent", "delivered", "viewed"])
      .limit(1);

    if (remainingError) {
      throw new Error(`Failed to inspect remaining offers: ${remainingError.message}`);
    }

    if (remainingLiveOffers?.length) continue;

    const { data: slot, error: slotError } = await supabase
      .from("open_slots")
      .select("id, starts_at, status, business_id")
      .eq("id", slotId)
      .maybeSingle();

    if (slotError) {
      throw new Error(`Failed to load slot: ${slotError.message}`);
    }

    if (!slot) continue;
    if (!["open", "offered", "claimed"].includes(slot.status)) continue;

    const slotStart = new Date(slot.starts_at).getTime();
    const isPastStart = slotStart <= Date.now();
    const nextStatus = isPastStart ? "expired" : "open";

    const { error: updateSlotError } = await supabase
      .from("open_slots")
      .update({ status: nextStatus })
      .eq("id", slotId)
      .eq("status", slot.status);

    if (updateSlotError) {
      throw new Error(`Failed to update slot status: ${updateSlotError.message}`);
    }

    const expiredForSlot = (staleOffers as StaleOffer[]).filter((o) => o.open_slot_id === slotId).length;

    const { error: auditError } = await supabase.from("audit_events").insert({
      business_id: slot.business_id,
      actor_type: "system",
      actor_id: null,
      event_type: nextStatus === "expired" ? "slot_expired" : "slot_reopened",
      entity_type: "open_slot",
      entity_id: slotId,
      metadata: {
        reason: "offer_expiry_sweep",
        expired_offer_count: expiredForSlot,
      },
    });

    if (auditError) {
      throw new Error(`Failed to write audit event: ${auditError.message}`);
    }

    if (nextStatus === "open") reopenedSlots += 1;
    else expiredSlots += 1;
  }

  return {
    expiredOffers: staleOffers.length,
    reopenedSlots,
    expiredSlots,
  };
}
