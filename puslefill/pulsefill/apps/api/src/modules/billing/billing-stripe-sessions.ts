import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { Env } from "../../config/env.js";
import { createStripeClient } from "./billing-stripe.js";

export type BillingCheckoutSessionArgs = {
  admin: SupabaseClient;
  stripe: Stripe;
  env: Env;
  businessId: string;
};

export type BillingPortalSessionArgs = {
  admin: SupabaseClient;
  stripe: Stripe;
  env: Env;
  businessId: string;
};

let checkoutSessionDelegate: ((args: BillingCheckoutSessionArgs) => Promise<{ url: string }>) | null = null;
let portalSessionDelegate: ((args: BillingPortalSessionArgs) => Promise<{ url: string }>) | null = null;

export function setBillingCheckoutSessionDelegateForTest(
  d: ((args: BillingCheckoutSessionArgs) => Promise<{ url: string }>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("billing checkout test delegate only when PULSEFILL_API_TEST=1");
  }
  checkoutSessionDelegate = d;
}

export function setBillingPortalSessionDelegateForTest(
  d: ((args: BillingPortalSessionArgs) => Promise<{ url: string }>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("billing portal test delegate only when PULSEFILL_API_TEST=1");
  }
  portalSessionDelegate = d;
}

export function resetBillingStripeSessionTestDelegates(): void {
  checkoutSessionDelegate = null;
  portalSessionDelegate = null;
}

async function ensureStripeCustomerId(
  admin: SupabaseClient,
  stripe: Stripe,
  businessId: string,
): Promise<string> {
  const { data: rows, error: selErr } = await admin
    .from("subscriptions")
    .select("id, stripe_customer_id")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (selErr) throw new Error(selErr.message);

  const row = rows?.[0] as { id: string; stripe_customer_id: string | null } | undefined;
  const existing = row?.stripe_customer_id?.trim();
  if (existing) return existing;

  const { data: biz, error: bizErr } = await admin.from("businesses").select("name").eq("id", businessId).maybeSingle();
  if (bizErr) throw new Error(bizErr.message);

  const name = (biz as { name?: string } | null)?.name?.trim() || "Workspace";

  const customer = await stripe.customers.create({
    name,
    metadata: { pulsefill_business_id: businessId },
  });

  const now = new Date().toISOString();
  if (row?.id) {
    const { error } = await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customer.id, updated_at: now })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("subscriptions").insert({
      business_id: businessId,
      stripe_customer_id: customer.id,
      plan: "starter",
      status: "incomplete",
      updated_at: now,
    });
    if (error) throw new Error(error.message);
  }

  return customer.id;
}

async function subscriptionStripeCustomerId(admin: SupabaseClient, businessId: string): Promise<string | null> {
  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const cid = (rows?.[0] as { stripe_customer_id: string | null } | undefined)?.stripe_customer_id?.trim();
  return cid || null;
}

export async function createBillingCheckoutSession(args: BillingCheckoutSessionArgs): Promise<{ url: string }> {
  if (checkoutSessionDelegate) return checkoutSessionDelegate(args);

  const { admin, stripe, env, businessId } = args;
  const priceId = env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim();
  const base = env.DASHBOARD_URL?.trim();
  if (!priceId) throw new Error("billing_missing_price_id");
  if (!base) throw new Error("billing_missing_dashboard_url");

  const customerId = await ensureStripeCustomerId(admin, stripe, businessId);

  const trialDays = env.STRIPE_TRIAL_PERIOD_DAYS;
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: {
      pulsefill_business_id: businessId,
      pulsefill_plan: "starter",
    },
  };
  if (typeof trialDays === "number" && trialDays > 0) {
    subscriptionData.trial_period_days = trialDays;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: businessId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/billing?checkout=cancelled`,
    subscription_data: subscriptionData,
    metadata: { pulsefill_business_id: businessId },
  });

  const url = session.url;
  if (!url) throw new Error("billing_checkout_missing_url");
  return { url };
}

export async function createBillingPortalSession(args: BillingPortalSessionArgs): Promise<{ url: string }> {
  if (portalSessionDelegate) return portalSessionDelegate(args);

  const { admin, stripe, env, businessId } = args;
  const base = env.DASHBOARD_URL?.trim();
  if (!base) throw new Error("billing_missing_dashboard_url");

  const customerId = await subscriptionStripeCustomerId(admin, businessId);
  if (!customerId) throw new Error("billing_portal_missing_customer");

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${base}/billing`,
  });

  const url = session.url;
  if (!url) throw new Error("billing_portal_missing_url");
  return { url };
}

export { createStripeClient };
