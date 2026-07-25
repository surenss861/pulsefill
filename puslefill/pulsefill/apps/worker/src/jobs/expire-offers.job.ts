import type { SupabaseClient } from "@supabase/supabase-js";

type ExpireSlotRpcResult = {
  ok: boolean;
  error?: string;
  expired_offers?: number;
  slot_status_changed?: boolean;
  next_status?: "open" | "expired";
};

export async function expireOffersJob(supabase: SupabaseClient) {
  const nowIso = new Date().toISOString();

  const { data: staleOffers, error: staleError } = await supabase
    .from("slot_offers")
    .select("open_slot_id")
    .eq("status", "sent")
    .lt("expires_at", nowIso);

  if (staleError) {
    throw new Error(`Failed to load stale offers: ${staleError.message}`);
  }

  if (!staleOffers?.length) {
    return { expiredOffers: 0, reopenedSlots: 0, expiredSlots: 0 };
  }

  const slotIds = [...new Set(staleOffers.map((o) => o.open_slot_id as string))];

  let expiredOffers = 0;
  let reopenedSlots = 0;
  let expiredSlots = 0;

  for (const slotId of slotIds) {
    const { data, error } = await supabase.rpc("expire_stale_open_slot_offers_for_slot", {
      p_open_slot_id: slotId,
    });

    if (error) {
      throw new Error(`Failed to expire offers for slot ${slotId}: ${error.message}`);
    }

    const result = data as ExpireSlotRpcResult;
    if (!result?.ok) continue;

    expiredOffers += result.expired_offers ?? 0;

    if (result.slot_status_changed) {
      if (result.next_status === "open") reopenedSlots += 1;
      else if (result.next_status === "expired") expiredSlots += 1;
    }
  }

  return { expiredOffers, reopenedSlots, expiredSlots };
}
