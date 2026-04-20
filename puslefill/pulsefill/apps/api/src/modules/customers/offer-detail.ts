import type { SupabaseClient } from "@supabase/supabase-js";

type Env = Record<string, string | undefined>;

function claimGuidanceDefault() {
  return {
    title: "Claim this opening",
    detail: "Claiming sends your intent right away. The clinic may still need to confirm the booking.",
  };
}

async function loadLabel(
  admin: SupabaseClient,
  table: "businesses" | "locations" | "services" | "providers",
  id: string | null | undefined,
): Promise<string | null> {
  if (!id) return null;
  const { data } = await admin.from(table).select("name").eq("id", id).maybeSingle();
  return (data as { name?: string } | null)?.name ?? null;
}

export async function fetchCustomerOfferDetail(
  admin: SupabaseClient,
  customerId: string,
  offerId: string,
): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 404 | 500; error: string }
> {
  const { data: offerRow, error } = await admin
    .from("slot_offers")
    .select(
      `
      id,
      status,
      sent_at,
      expires_at,
      channel,
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
    .eq("id", offerId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: "load_failed" };
  }
  if (!offerRow) {
    return { ok: false, status: 404, error: "not_found" };
  }

  const row = offerRow as Record<string, unknown>;
  const slot = (Array.isArray(row.open_slots) ? row.open_slots[0] : row.open_slots) as Record<
    string,
    unknown
  > | null;

  if (!slot) {
    return { ok: false, status: 404, error: "slot_missing" };
  }

  const businessId = String(slot.business_id ?? "");
  const [businessName, locationName, serviceName, providerName] = await Promise.all([
    loadLabel(admin, "businesses", businessId),
    loadLabel(admin, "locations", slot.location_id as string | undefined),
    loadLabel(admin, "services", slot.service_id as string | undefined),
    loadLabel(admin, "providers", slot.provider_id as string | undefined),
  ]);

  const displayProvider = providerName ?? (slot.provider_name_snapshot as string | null) ?? null;

  const { data: prefs } = await admin
    .from("standby_preferences")
    .select("id, business_id, location_id, service_id, provider_id, active")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .eq("active", true)
    .limit(5);

  const prefList = (prefs ?? []) as Array<Record<string, unknown>>;
  const matchPref =
    prefList.find((p) => {
      if (slot.service_id && p.service_id === slot.service_id) return true;
      if (slot.provider_id && p.provider_id === slot.provider_id) return true;
      if (slot.location_id && p.location_id === slot.location_id) return true;
      return false;
    }) ?? prefList[0];

  let matchedPreference: Record<string, unknown> | null = null;
  if (matchPref) {
    const [pb, pl, ps, pp] = await Promise.all([
      loadLabel(admin, "businesses", String(matchPref.business_id)),
      loadLabel(admin, "locations", matchPref.location_id as string | undefined),
      loadLabel(admin, "services", matchPref.service_id as string | undefined),
      loadLabel(admin, "providers", matchPref.provider_id as string | undefined),
    ]);
    matchedPreference = {
      id: matchPref.id,
      business_name: pb,
      service_name: ps,
      provider_name: pp,
      location_name: pl,
    };
  }

  const offer = {
    id: row.id,
    status: String(row.status),
    expires_at: row.expires_at,
    sent_at: row.sent_at,
    open_slot_id: row.open_slot_id,
    business_name: businessName,
    service_name: serviceName,
    location_name: locationName,
    provider_name: displayProvider,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    matched_preference: matchedPreference,
    claim_guidance: claimGuidanceDefault(),
  };

  return { ok: true, body: { offer } };
}
