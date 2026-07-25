import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { Env } from "../../config/env.js";
import { getConnectAccountSnapshot } from "./payments-connect.js";

export type SlotClaimPaymentRow = {
  id: string;
  open_slot_id: string;
  claim_id: string | null;
  customer_id: string;
  business_id: string;
  stripe_payment_intent_id: string;
  stripe_connect_account_id: string;
  amount_cents: number;
  application_fee_cents: number;
  currency: string;
  status: "requires_payment" | "authorized" | "capturing" | "captured" | "canceled" | "refunded" | "failed";
};

function computeApplicationFeeCents(amountCents: number, feeBps: number): number {
  return Math.round((amountCents * feeBps) / 10000);
}

type CreatePaymentIntentArgs = {
  admin: SupabaseClient;
  stripe: Stripe;
  env: Env;
  openSlotId: string;
  customerId: string;
};

let createPaymentIntentDelegate:
  | ((args: CreatePaymentIntentArgs) => Promise<{ client_secret: string; payment_intent_id: string }>)
  | null = null;
let markAuthorizedDelegate: ((args: { admin: SupabaseClient; stripe: Stripe; paymentIntentId: string }) => Promise<SlotClaimPaymentRow>) | null =
  null;

export function setCreatePaymentIntentDelegateForTest(
  d: ((args: CreatePaymentIntentArgs) => Promise<{ client_secret: string; payment_intent_id: string }>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("create payment-intent test delegate only when PULSEFILL_API_TEST=1");
  }
  createPaymentIntentDelegate = d;
}

export function setMarkPaymentAuthorizedDelegateForTest(
  d: ((args: { admin: SupabaseClient; stripe: Stripe; paymentIntentId: string }) => Promise<SlotClaimPaymentRow>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("mark payment authorized test delegate only when PULSEFILL_API_TEST=1");
  }
  markAuthorizedDelegate = d;
}

export function resetPaymentIntentTestDelegates(): void {
  createPaymentIntentDelegate = null;
  markAuthorizedDelegate = null;
}

type OpenSlotPaymentFields = {
  id: string;
  business_id: string;
  payment_required: boolean;
  price_cents: number | null;
  currency: string;
  status: string;
};

/**
 * Creates (or reuses, if one's already awaiting payment) the PaymentIntent for
 * a customer claiming a priced slot. Manual capture + destination charge to
 * the business's connected account, so the platform fee/transfer are computed
 * at capture time, not here.
 */
export async function createSlotClaimPaymentIntent(
  args: CreatePaymentIntentArgs,
): Promise<{ client_secret: string; payment_intent_id: string }> {
  if (createPaymentIntentDelegate) return createPaymentIntentDelegate(args);

  const { admin, stripe, env, openSlotId, customerId } = args;

  const { data: slot, error: slotErr } = await admin
    .from("open_slots")
    .select("id, business_id, payment_required, price_cents, currency, status")
    .eq("id", openSlotId)
    .maybeSingle();
  if (slotErr) throw new Error(`slot_lookup_failed:${slotErr.message}`);
  const slotRow = slot as OpenSlotPaymentFields | null;
  if (!slotRow) throw new Error("slot_not_found");
  if (!slotRow.payment_required || !slotRow.price_cents) throw new Error("slot_not_payable");
  if (!["open", "offered"].includes(slotRow.status)) throw new Error("slot_not_claimable");

  const connect = await getConnectAccountSnapshot(admin, slotRow.business_id);
  if (!connect.charges_enabled) throw new Error("business_payouts_not_enabled");

  const { data: existing, error: existingErr } = await admin
    .from("slot_claim_payments")
    .select("*")
    .eq("open_slot_id", openSlotId)
    .eq("customer_id", customerId)
    .eq("status", "requires_payment")
    .maybeSingle();
  if (existingErr) throw new Error(`payment_row_lookup_failed:${existingErr.message}`);

  if (existing) {
    const row = existing as SlotClaimPaymentRow;
    const pi = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id);
    if (pi.client_secret) {
      return { client_secret: pi.client_secret, payment_intent_id: pi.id };
    }
  }

  const applicationFeeCents = computeApplicationFeeCents(slotRow.price_cents, env.STRIPE_CONNECT_PLATFORM_FEE_BPS);

  const intent = await stripe.paymentIntents.create({
    amount: slotRow.price_cents,
    currency: slotRow.currency || "usd",
    capture_method: "manual",
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: connect.stripe_account_id },
    metadata: {
      pulsefill_open_slot_id: openSlotId,
      pulsefill_customer_id: customerId,
      pulsefill_business_id: slotRow.business_id,
    },
  });

  const { error: insErr } = await admin.from("slot_claim_payments").insert({
    open_slot_id: openSlotId,
    customer_id: customerId,
    business_id: slotRow.business_id,
    stripe_payment_intent_id: intent.id,
    stripe_connect_account_id: connect.stripe_account_id,
    amount_cents: slotRow.price_cents,
    application_fee_cents: applicationFeeCents,
    currency: slotRow.currency || "usd",
    status: "requires_payment",
  });
  if (insErr) throw new Error(`payment_row_insert_failed:${insErr.message}`);

  if (!intent.client_secret) throw new Error("payment_intent_missing_client_secret");
  return { client_secret: intent.client_secret, payment_intent_id: intent.id };
}

/**
 * Called from the claim route right before invoking `claim_open_slot`: confirms
 * with Stripe (source of truth) that the PaymentIntent actually reached
 * `requires_capture`, then flips the local row to `authorized` so the RPC's
 * gate can see it. Kept synchronous rather than waiting on the webhook so the
 * claim path doesn't race an at-least-once, out-of-order webhook delivery.
 */
export async function markSlotClaimPaymentAuthorized(args: {
  admin: SupabaseClient;
  stripe: Stripe;
  paymentIntentId: string;
}): Promise<SlotClaimPaymentRow> {
  if (markAuthorizedDelegate) return markAuthorizedDelegate(args);

  const { admin, stripe, paymentIntentId } = args;
  const { data: row, error } = await admin
    .from("slot_claim_payments")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (error) throw new Error(`payment_row_lookup_failed:${error.message}`);
  const paymentRow = row as SlotClaimPaymentRow | null;
  if (!paymentRow) throw new Error("payment_not_found");
  if (paymentRow.status === "authorized") return paymentRow;
  if (paymentRow.status !== "requires_payment") throw new Error(`payment_wrong_status:${paymentRow.status}`);

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "requires_capture") {
    throw new Error(`payment_not_authorized:${intent.status}`);
  }

  const { error: updErr } = await admin
    .from("slot_claim_payments")
    .update({ status: "authorized", authorized_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", paymentRow.id)
    .eq("status", "requires_payment");
  if (updErr) throw new Error(`payment_row_update_failed:${updErr.message}`);

  return { ...paymentRow, status: "authorized" };
}

/**
 * Called when `claim_open_slot` rejects a claim that had an authorized
 * payment attached (lost race, slot no longer claimable, etc.) — releases the
 * Stripe authorization and records it, so the customer sees "not charged"
 * immediately rather than waiting on the 7-day auto-expiry.
 */
export async function releaseAuthorizedPaymentByIntentId(
  admin: SupabaseClient,
  stripe: Stripe,
  paymentIntentId: string,
): Promise<void> {
  const { data: row, error } = await admin
    .from("slot_claim_payments")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "authorized")
    .maybeSingle();
  if (error) throw new Error(`payment_row_lookup_failed:${error.message}`);
  const paymentId = (row as { id: string } | null)?.id;
  if (!paymentId) return;

  await cancelStripePaymentIntent(stripe, paymentIntentId);
  await admin.rpc("cancel_slot_claim_payment_and_release", { p_payment_id: paymentId });
}

export async function cancelStripePaymentIntent(stripe: Stripe, paymentIntentId: string): Promise<void> {
  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (err) {
    // Already-canceled/terminal states are not actionable errors here — the
    // caller's DB-side record is what matters going forward.
    const message = err instanceof Error ? err.message : String(err);
    if (!message.toLowerCase().includes("no longer be canceled")) throw err;
  }
}

export async function captureStripePaymentIntent(stripe: Stripe, paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function refundStripePayment(
  stripe: Stripe,
  paymentIntentId: string,
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
  });
}
