import type { createServiceSupabase } from "../config/supabase.js";
import {
  matchStandbyPreferencesForSendOffers,
  type OpenSlotRow,
  type StandbyPreferenceRow,
} from "./standby-matcher.js";

type Admin = ReturnType<typeof createServiceSupabase>;

/**
 * Loads active preferences, active memberships, existing offers for the slot, and runs the matcher.
 * Used by POST send-offers and bulk retry_offers so behavior stays aligned.
 */
export async function computeStandbyMatchesForOpenSlot(
  admin: Admin,
  input: {
    openSlotId: string;
    slot: OpenSlotRow;
    businessTimezone: string;
  },
): Promise<{
  prefRows: StandbyPreferenceRow[];
  matchPack: ReturnType<typeof matchStandbyPreferencesForSendOffers>;
  uniqueMatches: StandbyPreferenceRow[];
}> {
  const bid = input.slot.business_id;
  const { data: prefs, error: prefErr } = await admin
    .from("standby_preferences")
    .select("*")
    .eq("business_id", bid)
    .eq("active", true);
  if (prefErr) {
    throw new Error("prefs_load_failed");
  }
  const prefRows = (prefs ?? []) as StandbyPreferenceRow[];

  const customerIds = [...new Set(prefRows.map((p) => p.customer_id))];
  let activeMemberCustomerIds = new Set<string>();
  if (customerIds.length > 0) {
    const { data: mems, error: memErr } = await admin
      .from("customer_business_memberships")
      .select("customer_id")
      .eq("business_id", bid)
      .eq("status", "active")
      .in("customer_id", customerIds);
    if (memErr) {
      throw new Error("memberships_load_failed");
    }
    activeMemberCustomerIds = new Set((mems ?? []).map((m: { customer_id: string }) => m.customer_id));
  }

  const { data: existingOffers, error: offErr } = await admin
    .from("slot_offers")
    .select("customer_id")
    .eq("open_slot_id", input.openSlotId);
  if (offErr) {
    throw new Error("offers_load_failed");
  }
  const existingOfferCustomerIds = new Set(
    (existingOffers ?? []).map((o: { customer_id: string }) => o.customer_id),
  );

  const matchPack = matchStandbyPreferencesForSendOffers(
    input.slot,
    { timezone: input.businessTimezone },
    prefRows,
    activeMemberCustomerIds,
    existingOfferCustomerIds,
  );

  const uniqueByCustomer = new Map<string, StandbyPreferenceRow>();
  for (const m of matchPack.matches) {
    uniqueByCustomer.set(m.customer_id, m);
  }
  const uniqueMatches = [...uniqueByCustomer.values()];

  return { prefRows, matchPack, uniqueMatches };
}
