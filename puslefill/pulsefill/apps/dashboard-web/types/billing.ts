export type BillingSubscriptionPlan = "starter" | "growth" | "multi_location";
export type BillingSubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";

export type BillingEntitlementStatusReason =
  | "trialing"
  | "active"
  | "past_due"
  | "incomplete"
  | "canceled"
  | "no_subscription"
  | "billing_unavailable";

export type BillingEntitlements = {
  can_create_openings: boolean;
  can_send_offers: boolean;
  can_invite_customers: boolean;
  billing_notice_required: boolean;
  status_reason: BillingEntitlementStatusReason;
  notice: { title: string; message: string };
};

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
  /** Present on current API; omitted on older responses — treat as soft billing hints only. */
  entitlements?: BillingEntitlements;
};
