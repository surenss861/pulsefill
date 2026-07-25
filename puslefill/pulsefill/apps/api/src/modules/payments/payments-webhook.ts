import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { applyConnectAccountUpdateFromWebhook } from "./payments-connect.js";

let verifiedPaymentsWebhookDelegate: ((event: Stripe.Event) => Promise<void>) | null = null;

export function setPaymentsVerifiedWebhookDelegateForTest(d: ((event: Stripe.Event) => Promise<void>) | null): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("payments webhook test delegate only when PULSEFILL_API_TEST=1");
  }
  verifiedPaymentsWebhookDelegate = d;
}

async function updatePaymentByIntentId(
  admin: SupabaseClient,
  paymentIntentId: string,
  fromStatuses: string[],
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin
    .from("slot_claim_payments")
    .update(patch)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .in("status", fromStatuses);
  if (error) throw new Error(`slot_claim_payment_webhook_update_failed:${error.message}`);
}

async function handlePaymentIntentEvent(admin: SupabaseClient, event: Stripe.Event): Promise<void> {
  const intent = event.data.object as Stripe.PaymentIntent;
  const nowIso = new Date().toISOString();

  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      // Server-confirmed authorization — defense-in-depth alongside the
      // synchronous mark-authorized call in the claim route.
      await updatePaymentByIntentId(admin, intent.id, ["requires_payment"], {
        status: "authorized",
        authorized_at: nowIso,
        updated_at: nowIso,
      });
      break;
    case "payment_intent.succeeded":
      await updatePaymentByIntentId(admin, intent.id, ["authorized", "capturing"], {
        status: "captured",
        captured_at: nowIso,
        updated_at: nowIso,
      });
      break;
    case "payment_intent.payment_failed":
      await updatePaymentByIntentId(admin, intent.id, ["requires_payment", "authorized", "capturing"], {
        status: "failed",
        failure_reason: intent.last_payment_error?.message ?? "payment_failed",
        updated_at: nowIso,
      });
      break;
    case "payment_intent.canceled":
      // Covers both our own explicit cancels and Stripe's automatic 7-day
      // authorization expiry — no-op if we already recorded it ourselves.
      await updatePaymentByIntentId(admin, intent.id, ["requires_payment", "authorized"], {
        status: "canceled",
        canceled_at: nowIso,
        updated_at: nowIso,
      });
      break;
    default:
      break;
  }
}

async function handleChargeRefundedEvent(admin: SupabaseClient, event: Stripe.Event): Promise<void> {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  await updatePaymentByIntentId(admin, paymentIntentId, ["captured"], {
    status: "refunded",
    refunded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function handleVerifiedPaymentsStripeWebhook(admin: SupabaseClient, event: Stripe.Event): Promise<void> {
  if (verifiedPaymentsWebhookDelegate) {
    await verifiedPaymentsWebhookDelegate(event);
    return;
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await applyConnectAccountUpdateFromWebhook(admin, account);
      break;
    }
    case "payment_intent.amount_capturable_updated":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      await handlePaymentIntentEvent(admin, event);
      break;
    case "charge.refunded":
      await handleChargeRefundedEvent(admin, event);
      break;
    default:
      break;
  }
}
