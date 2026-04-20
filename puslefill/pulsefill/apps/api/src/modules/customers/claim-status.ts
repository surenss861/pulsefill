import type { SupabaseClient } from "@supabase/supabase-js";
import { buildClaimOutcomePayload, type ClaimOutcomeState } from "./claim-outcome-guidance.js";

async function loadSlotLabels(
  admin: SupabaseClient,
  slot: Record<string, unknown>,
): Promise<{ businessName: string | null; serviceName: string | null; locationName: string | null; providerName: string | null }> {
  const bid = slot.business_id as string | undefined;
  const lid = slot.location_id as string | undefined;
  const sid = slot.service_id as string | undefined;
  const pid = slot.provider_id as string | undefined;

  const [b, l, s, p] = await Promise.all([
    bid
      ? admin.from("businesses").select("name").eq("id", bid).maybeSingle()
      : Promise.resolve({ data: null }),
    lid
      ? admin.from("locations").select("name").eq("id", lid).maybeSingle()
      : Promise.resolve({ data: null }),
    sid
      ? admin.from("services").select("name").eq("id", sid).maybeSingle()
      : Promise.resolve({ data: null }),
    pid
      ? admin.from("providers").select("name").eq("id", pid).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const providerName =
    (p.data as { name?: string } | null)?.name ?? (slot.provider_name_snapshot as string | null) ?? null;

  return {
    businessName: (b.data as { name?: string } | null)?.name ?? null,
    locationName: (l.data as { name?: string } | null)?.name ?? null,
    serviceName: (s.data as { name?: string } | null)?.name ?? null,
    providerName,
  };
}

function resolveOutcomeState(args: {
  claimStatus: string;
  slotStatus: string;
}): ClaimOutcomeState {
  const cs = args.claimStatus;
  const ss = args.slotStatus;

  if (cs === "confirmed" && ss === "booked") return "confirmed";
  if (cs === "confirmed") return "confirmed";
  if (cs === "won" && ss === "claimed") return "pending_confirmation";
  if (cs === "won" && ss === "booked") return "confirmed";
  if (cs === "lost") return "lost";
  if (ss === "expired" || ss === "cancelled") return "expired";
  if (cs === "failed") return "unavailable";
  if (cs === "pending") return "pending_confirmation";
  return "unknown";
}

export async function fetchCustomerClaimStatus(
  admin: SupabaseClient,
  customerId: string,
  claimId: string,
): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 404 | 500; error: string }
> {
  const { data: claim, error } = await admin
    .from("slot_claims")
    .select(
      `
      id,
      status,
      open_slot_id,
      claimed_at,
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
    .eq("id", claimId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) return { ok: false, status: 500, error: "load_failed" };
  if (!claim) return { ok: false, status: 404, error: "not_found" };

  const c = claim as Record<string, unknown>;
  const slot = (Array.isArray(c.open_slots) ? c.open_slots[0] : c.open_slots) as Record<string, unknown> | null;
  if (!slot) return { ok: false, status: 404, error: "slot_missing" };

  const labels = await loadSlotLabels(admin, slot);
  const claimStatus = String(c.status ?? "");
  const slotStatus = String(slot.status ?? "");
  const state = resolveOutcomeState({ claimStatus, slotStatus });

  const offerIdRow = await admin
    .from("slot_offers")
    .select("id")
    .eq("open_slot_id", String(c.open_slot_id))
    .eq("customer_id", customerId)
    .maybeSingle();

  const outcomePayload = buildClaimOutcomePayload({
    state,
    businessName: labels.businessName,
    serviceName: labels.serviceName,
  });

  const body = {
    claim: {
      id: c.id,
      status: claimStatus,
      open_slot_id: c.open_slot_id,
      offer_id: (offerIdRow.data as { id?: string } | null)?.id ?? null,
      business_name: labels.businessName,
      service_name: labels.serviceName,
      location_name: labels.locationName,
      provider_name: labels.providerName,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
    },
    outcome: {
      state,
      title: outcomePayload.title,
      detail: outcomePayload.detail,
    },
    next_steps: outcomePayload.next_steps,
  };

  return { ok: true, body };
}
