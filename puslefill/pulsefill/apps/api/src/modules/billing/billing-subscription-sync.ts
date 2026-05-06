import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { BillingSubscriptionPlan, BillingSubscriptionStatus } from "./billing-summary.js";

export function mapStripeSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): BillingSubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "past_due";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "canceled";
    case "paused":
      return "active";
    default:
      return "incomplete";
  }
}

function planFromMetadata(metadata: Stripe.Metadata | null | undefined): BillingSubscriptionPlan {
  const p = metadata?.pulsefill_plan;
  if (p === "growth" || p === "multi_location" || p === "starter") return p;
  return "starter";
}

export function resolveBusinessIdFromCheckoutSession(session: Stripe.Checkout.Session): string | null {
  const fromMeta = session.metadata?.pulsefill_business_id?.trim();
  if (fromMeta && /^[0-9a-f-]{36}$/i.test(fromMeta)) return fromMeta;
  const ref = session.client_reference_id?.trim();
  if (ref && /^[0-9a-f-]{36}$/i.test(ref)) return ref;
  return null;
}

export function resolveBusinessIdFromStripeSubscription(sub: Stripe.Subscription): string | null {
  const bid = sub.metadata?.pulsefill_business_id?.trim();
  if (bid && /^[0-9a-f-]{36}$/i.test(bid)) return bid;
  return null;
}

function stripeCustomerId(sub: Stripe.Subscription): string | null {
  const c = sub.customer;
  if (typeof c === "string") return c;
  if (c && !("deleted" in c && c.deleted)) return c.id;
  return null;
}

export async function upsertSubscriptionFromStripe(
  admin: SupabaseClient,
  businessId: string,
  stripeSub: Stripe.Subscription,
): Promise<void> {
  const customerId = stripeCustomerId(stripeSub);
  const plan = planFromMetadata(stripeSub.metadata);
  const status = mapStripeSubscriptionStatus(stripeSub.status);
  const periodEnd =
    typeof stripeSub.current_period_end === "number"
      ? new Date(stripeSub.current_period_end * 1000).toISOString()
      : null;

  const { data: rows, error: selErr } = await admin
    .from("subscriptions")
    .select("id")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (selErr) throw new Error(selErr.message);

  const existingId = (rows?.[0] as { id: string } | undefined)?.id;

  const payload = {
    business_id: businessId,
    stripe_customer_id: customerId,
    stripe_subscription_id: stripeSub.id,
    plan,
    status,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const { error } = await admin.from("subscriptions").update(payload).eq("id", existingId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("subscriptions").insert(payload);
    if (error) throw new Error(error.message);
  }
}
