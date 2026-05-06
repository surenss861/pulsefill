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

/** Minimal subscription shape for entitlement rules (avoids circular imports with billing-summary). */
export type BillingEntitlementsSubscription = {
  status: string;
};

export type BillingEntitlementsInput = {
  stripe_billing_available: boolean;
  subscription: BillingEntitlementsSubscription | null;
  nodeEnv: "development" | "test" | "production";
};

/** Soft v1: never blocks core recovery; flags + copy for dashboard notices only. */
export function computeBillingEntitlements(input: BillingEntitlementsInput): BillingEntitlements {
  const permissive = {
    can_create_openings: true as const,
    can_send_offers: true as const,
    can_invite_customers: true as const,
  };

  if (!input.stripe_billing_available) {
    const billing_notice_required = input.nodeEnv === "production";
    return {
      ...permissive,
      billing_notice_required,
      status_reason: "billing_unavailable",
      notice: billing_notice_required
        ? {
            title: "Billing not configured",
            message:
              "Stripe billing is not configured on this API. Ask your operator to set Stripe keys so subscriptions and the billing portal work.",
          }
        : {
            title: "Billing (local)",
            message: "Stripe billing is not configured in this environment. This is normal for local development.",
          },
    };
  }

  if (!input.subscription) {
    return {
      ...permissive,
      billing_notice_required: true,
      status_reason: "no_subscription",
      notice: {
        title: "Start your subscription",
        message: "Add an active subscription so renewals and the billing portal stay in sync with this workspace.",
      },
    };
  }

  const { status } = input.subscription;

  if (status === "trialing" || status === "active") {
    return {
      ...permissive,
      billing_notice_required: false,
      status_reason: status,
      notice: {
        title: "Billing active",
        message: "Your workspace is ready to use PulseFill.",
      },
    };
  }

  if (status === "past_due") {
    return {
      ...permissive,
      billing_notice_required: true,
      status_reason: "past_due",
      notice: {
        title: "Payment past due",
        message: "Update your payment method in the billing portal so service is not interrupted.",
      },
    };
  }

  if (status === "incomplete") {
    return {
      ...permissive,
      billing_notice_required: true,
      status_reason: "incomplete",
      notice: {
        title: "Complete subscription setup",
        message: "Finish subscription checkout to activate billing for this workspace.",
      },
    };
  }

  if (status === "canceled") {
    return {
      ...permissive,
      billing_notice_required: true,
      status_reason: "canceled",
      notice: {
        title: "Subscription canceled",
        message: "This workspace’s subscription is canceled. You can still run recovery; renew billing when you are ready.",
      },
    };
  }

  return {
    ...permissive,
    billing_notice_required: false,
    status_reason: "active",
    notice: {
      title: "Billing active",
      message: "Your workspace is ready to use PulseFill.",
    },
  };
}
