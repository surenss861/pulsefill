import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type AuthorizedPaymentRow = {
  id: string;
  open_slot_id: string;
  stripe_payment_intent_id: string;
};

type ReleaseRpcResult = { ok: boolean; error?: string };

function stripeClientFromEnv(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia", typescript: true });
}

/**
 * Releases payment authorizations left behind when a paid slot moved on
 * without ever reaching capture — e.g. staff cancelled the slot, or the
 * offer-expiry sweep reopened it — since neither of those paths releases the
 * hold on its own. Deliberately tied to the slot's actual state (not a fixed
 * timer): a payment is stale once its slot is no longer `claimed`.
 */
export async function releaseStaleSlotPaymentAuthorizationsJob(supabase: SupabaseClient) {
  const { data: authorized, error } = await supabase
    .from("slot_claim_payments")
    .select("id, open_slot_id, stripe_payment_intent_id")
    .eq("status", "authorized");

  if (error) {
    throw new Error(`Failed to load authorized payments: ${error.message}`);
  }
  if (!authorized?.length) {
    return { released: 0, skipped: 0 };
  }

  const rows = authorized as AuthorizedPaymentRow[];
  const slotIds = [...new Set(rows.map((r) => r.open_slot_id))];

  const { data: slots, error: slotsError } = await supabase
    .from("open_slots")
    .select("id, status")
    .in("id", slotIds);

  if (slotsError) {
    throw new Error(`Failed to load slots for stale payment check: ${slotsError.message}`);
  }

  const slotStatusById = new Map((slots ?? []).map((s) => [s.id as string, s.status as string]));

  const stripe = stripeClientFromEnv();
  let released = 0;
  let skipped = 0;

  for (const row of rows) {
    const slotStatus = slotStatusById.get(row.open_slot_id);
    if (slotStatus === "claimed") {
      skipped += 1;
      continue;
    }

    if (stripe) {
      try {
        await stripe.paymentIntents.cancel(row.stripe_payment_intent_id);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (!message.toLowerCase().includes("no longer be canceled")) {
          console.error("[pulsefill-jobs] failed to cancel stale payment intent", row.stripe_payment_intent_id, e);
          continue;
        }
      }
    }

    const { data, error: rpcError } = await supabase.rpc("cancel_slot_claim_payment_and_release", {
      p_payment_id: row.id,
    });
    if (rpcError) {
      console.error("[pulsefill-jobs] failed to release stale payment row", row.id, rpcError);
      continue;
    }
    if ((data as ReleaseRpcResult | null)?.ok) released += 1;
  }

  return { released, skipped };
}
