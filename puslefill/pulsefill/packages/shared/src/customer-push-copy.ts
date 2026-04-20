import type { CustomerPushEventType } from "./customer-push-payload.js";

export type CustomerPushCopyContext = {
  businessName?: string | null;
  serviceName?: string | null;
};

/** Default APNs alert strings for each customer push event (single source of truth). */
export function getCustomerPushCopy(
  kind: CustomerPushEventType,
  ctx: CustomerPushCopyContext = {},
): { title: string; body: string } {
  const clinic = ctx.businessName?.trim() || "Clinic";

  switch (kind) {
    case "offer_received":
      return {
        title: "New opening available",
        body: `${clinic} has a matching opening for you.`,
      };
    case "offer_expiring_soon":
      return {
        title: "Offer expiring soon",
        body: "This opening may not be available for long.",
      };
    case "offer_expired":
      return {
        title: "Offer expired",
        body: "This opening is no longer available.",
      };
    case "claim_submitted":
      return {
        title: "Claim submitted",
        body: "We sent your claim to the clinic.",
      };
    case "claim_pending_confirmation":
      return {
        title: "Claim received",
        body: "Your claim is in. The clinic still needs to confirm it.",
      };
    case "booking_confirmed":
      return {
        title: "Booking confirmed",
        body: `${clinic} confirmed your opening.`,
      };
    case "claim_unavailable":
      return {
        title: "Opening no longer available",
        body: "This opening is no longer available.",
      };
    case "missed_opportunity":
      return {
        title: "You missed an opening",
        body: "A matching opening passed by. You can review what happened in the app.",
      };
    case "standby_status_reminder":
      return {
        title: "Check your standby setup",
        body: "Review your standby status and readiness.",
      };
    case "standby_setup_suggestion":
      return {
        title: "Improve your standby setup",
        body: "A few small changes could help you catch more openings.",
      };
  }
}
