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
  stripe_billing_available: boolean;
  billing_portal_available: boolean;
  subscription_checkout_available: boolean;
  subscription: BillingSummarySubscription | null;
};
