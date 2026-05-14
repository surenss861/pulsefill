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
  can_review_standby_requests: boolean;
  can_confirm_bookings: boolean;
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

/**
 * Production: paid operational subscription (trialing/active) is required for gated staff actions
 * (openings, offers, invites, waitlist review, booking confirmation). Non-production stays permissive
 * so local + automated tests keep working without Stripe rows.
 */
export function computeBillingEntitlements(input: BillingEntitlementsInput): BillingEntitlements {
  const strict = input.nodeEnv === "production";

  const allOn = {
    can_create_openings: true as const,
    can_send_offers: true as const,
    can_invite_customers: true as const,
    can_review_standby_requests: true as const,
    can_confirm_bookings: true as const,
  };

  const gatedOff = {
    can_create_openings: false as const,
    can_send_offers: false as const,
    can_invite_customers: false as const,
    can_review_standby_requests: false as const,
    can_confirm_bookings: false as const,
  };

  const applyStrict = (paidOk: boolean) => (!strict ? true : paidOk);

  if (!input.stripe_billing_available) {
    const billing_notice_required = strict;
    const paidOk = false;
    const features = applyStrict(paidOk) ? allOn : gatedOff;
    return {
      ...features,
      billing_notice_required,
      status_reason: "billing_unavailable",
      notice: billing_notice_required
        ? {
            title: "Billing not configured",
            message:
              "Stripe billing is not configured on this API. Turn on billing before creating openings, sending offers, inviting customers, or reviewing waitlist requests.",
          }
        : {
            title: "Billing (local)",
            message: "Stripe billing is not configured in this environment. This is normal for local development.",
          },
    };
  }

  if (!input.subscription) {
    const paidOk = false;
    const features = applyStrict(paidOk) ? allOn : gatedOff;
    return {
      ...features,
      billing_notice_required: true,
      status_reason: "no_subscription",
      notice: {
        title: "Start your subscription",
        message: strict
          ? "Activate a subscription before creating openings, sending offers, inviting customers, or reviewing waitlist requests."
          : "Add an active subscription so renewals and the billing portal stay in sync with this workspace.",
      },
    };
  }

  const { status } = input.subscription;

  if (status === "trialing" || status === "active") {
    return {
      ...allOn,
      billing_notice_required: false,
      status_reason: status,
      notice: {
        title: "Billing active",
        message: "Your workspace is ready to use PulseFill.",
      },
    };
  }

  if (status === "past_due") {
    const features = applyStrict(false) ? allOn : gatedOff;
    return {
      ...features,
      billing_notice_required: true,
      status_reason: "past_due",
      notice: {
        title: "Payment past due",
        message: strict
          ? "Update your payment method in the billing portal to continue creating openings, sending offers, inviting customers, and reviewing waitlist requests."
          : "Update your payment method in the billing portal so service is not interrupted.",
      },
    };
  }

  if (status === "incomplete") {
    const features = applyStrict(false) ? allOn : gatedOff;
    return {
      ...features,
      billing_notice_required: true,
      status_reason: "incomplete",
      notice: {
        title: "Complete subscription setup",
        message: strict
          ? "Finish subscription checkout before running paid workspace actions (openings, offers, invites, waitlist review)."
          : "Finish subscription checkout to activate billing for this workspace.",
      },
    };
  }

  if (status === "canceled") {
    const features = applyStrict(false) ? allOn : gatedOff;
    return {
      ...features,
      billing_notice_required: true,
      status_reason: "canceled",
      notice: {
        title: "Subscription canceled",
        message: strict
          ? "This workspace’s subscription is canceled. Renew billing to create openings, send offers, invite customers, and review waitlist requests."
          : "This workspace’s subscription is canceled. You can still run recovery; renew billing when you are ready.",
      },
    };
  }

  return {
    ...allOn,
    billing_notice_required: false,
    status_reason: "active",
    notice: {
      title: "Billing active",
      message: "Your workspace is ready to use PulseFill.",
    },
  };
}
