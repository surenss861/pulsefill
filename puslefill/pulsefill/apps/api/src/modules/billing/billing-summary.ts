import type { SupabaseClient } from "@supabase/supabase-js";

import type { Env } from "../../config/env.js";
import { computeBillingEntitlements, type BillingEntitlements } from "./billing-entitlements.js";

export type BillingSubscriptionPlan = "starter" | "growth" | "multi_location";
export type BillingSubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";

export type BillingSummarySubscription = {
  plan: BillingSubscriptionPlan;
  status: BillingSubscriptionStatus;
  current_period_end: string | null;
  stripe_customer_linked: boolean;
  stripe_subscription_linked: boolean;
};

export type BillingSummaryResponse = {
  /** Server has Stripe secret configured (checkout/portal can be wired). */
  stripe_billing_available: boolean;
  /** Self-serve customer portal session creation is implemented. */
  billing_portal_available: boolean;
  /** Stripe Checkout for subscription is implemented. */
  subscription_checkout_available: boolean;
  subscription: BillingSummarySubscription | null;
  entitlements: BillingEntitlements;
};

export type BillingSummaryPayload = Omit<BillingSummaryResponse, "entitlements">;

let getBillingSummaryTestDelegate: null | ((businessId: string) => Promise<BillingSummaryPayload>) = null;

export function setGetBillingSummaryTestDelegate(
  d: ((businessId: string) => Promise<BillingSummaryPayload>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("billing summary test delegate only when PULSEFILL_API_TEST=1");
  }
  getBillingSummaryTestDelegate = d;
}

function withEntitlements(env: Env, base: Omit<BillingSummaryResponse, "entitlements">): BillingSummaryResponse {
  return {
    ...base,
    entitlements: computeBillingEntitlements({
      stripe_billing_available: base.stripe_billing_available,
      subscription: base.subscription,
      nodeEnv: env.NODE_ENV,
    }),
  };
}

export async function getBillingSummary(admin: SupabaseClient, businessId: string, env: Env): Promise<BillingSummaryResponse> {
  if (getBillingSummaryTestDelegate) {
    const base = await getBillingSummaryTestDelegate(businessId);
    return withEntitlements(env, base);
  }

  const stripe_billing_available = Boolean(env.STRIPE_SECRET_KEY?.trim());
  const billingRoutesOn = Boolean(env.ENABLE_BILLING_ROUTES);
  const dashboardOrigin = env.DASHBOARD_URL?.trim();
  const priceConfigured = Boolean(env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim());

  const subscription_checkout_available = Boolean(
    billingRoutesOn && stripe_billing_available && priceConfigured && dashboardOrigin,
  );

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("plan, status, current_period_end, stripe_customer_id, stripe_subscription_id")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error("billing_summary_failed");
  }

  const row = rows?.[0] as
    | {
        plan: string;
        status: string;
        current_period_end: string | null;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
      }
    | undefined;

  if (!row) {
    return withEntitlements(env, {
      stripe_billing_available,
      billing_portal_available: false,
      subscription_checkout_available,
      subscription: null,
    });
  }

  const plan = row.plan as BillingSubscriptionPlan;
  const status = row.status as BillingSubscriptionStatus;
  const stripe_customer_linked = Boolean(row.stripe_customer_id?.trim());
  const billing_portal_available = Boolean(
    billingRoutesOn && stripe_billing_available && stripe_customer_linked && dashboardOrigin,
  );

  return withEntitlements(env, {
    stripe_billing_available,
    billing_portal_available,
    subscription_checkout_available,
    subscription: {
      plan,
      status,
      current_period_end: row.current_period_end ?? null,
      stripe_customer_linked,
      stripe_subscription_linked: Boolean(row.stripe_subscription_id?.trim()),
    },
  });
}
