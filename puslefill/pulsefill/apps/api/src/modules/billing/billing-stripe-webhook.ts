import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import {
  resolveBusinessIdFromCheckoutSession,
  resolveBusinessIdFromStripeSubscription,
  upsertSubscriptionFromStripe,
} from "./billing-subscription-sync.js";

let verifiedWebhookDelegate: ((event: Stripe.Event) => Promise<void>) | null = null;

export function setStripeVerifiedWebhookDelegateForTest(d: ((event: Stripe.Event) => Promise<void>) | null): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("stripe webhook test delegate only when PULSEFILL_API_TEST=1");
  }
  verifiedWebhookDelegate = d;
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub) return sub.id;
  return null;
}

async function syncSubscriptionForBusiness(
  admin: SupabaseClient,
  stripe: Stripe,
  businessId: string,
  subscriptionId: string,
): Promise<void> {
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
  const resolved = resolveBusinessIdFromStripeSubscription(stripeSub);
  if (resolved !== businessId) {
    throw new Error("stripe_webhook_business_mismatch");
  }
  await upsertSubscriptionFromStripe(admin, businessId, stripeSub);
}

export async function handleVerifiedStripeWebhook(
  admin: SupabaseClient,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> {
  if (verifiedWebhookDelegate) {
    await verifiedWebhookDelegate(event);
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") return;
      const businessId = resolveBusinessIdFromCheckoutSession(session);
      if (!businessId) return;

      const subRef = session.subscription;
      const subId = typeof subRef === "string" ? subRef : subRef?.id;
      if (!subId) return;

      await syncSubscriptionForBusiness(admin, stripe, businessId, subId);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const businessId = resolveBusinessIdFromStripeSubscription(stripeSub);
      if (!businessId) return;
      await upsertSubscriptionFromStripe(admin, businessId, stripeSub);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = subscriptionIdFromInvoice(invoice);
      if (!subId) return;
      const stripeSub = await stripe.subscriptions.retrieve(subId);
      const businessId = resolveBusinessIdFromStripeSubscription(stripeSub);
      if (!businessId) return;
      await upsertSubscriptionFromStripe(admin, businessId, stripeSub);
      break;
    }
    default:
      break;
  }
}
