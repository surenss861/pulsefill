import type { CustomerEventKind } from "./customer-event-taxonomy.js";

export type CustomerEventCopyInput = {
  kind: CustomerEventKind;
  businessName?: string | null;
  serviceName?: string | null;
  startsAt?: string | null;
};

export type CustomerEventCopy = {
  title: string;
  detail?: string;
  pushTitle?: string;
  pushBody?: string;
  stateLabel?: string;
};

export function getCustomerEventCopy(input: CustomerEventCopyInput): CustomerEventCopy {
  const clinic = input.businessName?.trim() || "Clinic";
  const service = input.serviceName?.trim() || "Opening";

  switch (input.kind) {
    case "offer_received":
      return {
        title: "Offer received",
        detail: `${clinic} · ${service}`,
        pushTitle: "New opening available",
        pushBody: `${clinic} has a matching opening for you.`,
        stateLabel: "New offer",
      };
    case "offer_expiring_soon":
      return {
        title: "Offer expiring soon",
        detail: `${clinic} · ${service}`,
        pushTitle: "Offer expiring soon",
        pushBody: "This opening may not be available for long.",
        stateLabel: "Expiring soon",
      };
    case "offer_expired":
      return {
        title: "Offer expired",
        detail: `${clinic} · ${service}`,
        pushTitle: "Offer expired",
        pushBody: "This opening is no longer available.",
        stateLabel: "Expired",
      };
    case "claim_submitted":
      return {
        title: "Claim submitted",
        detail: "We sent your claim right away.",
        pushTitle: "Claim submitted",
        pushBody: "We sent your claim to the clinic.",
        stateLabel: "Submitted",
      };
    case "claim_pending_confirmation":
      return {
        title: "Waiting for clinic confirmation",
        detail: "The clinic still needs to confirm the booking.",
        pushTitle: "Claim received",
        pushBody: "Your claim is in. The clinic still needs to confirm it.",
        stateLabel: "Pending confirmation",
      };
    case "booking_confirmed":
      return {
        title: "Booking confirmed",
        detail: `${clinic} confirmed your opening.`,
        pushTitle: "Booking confirmed",
        pushBody: `${clinic} confirmed your opening.`,
        stateLabel: "Confirmed",
      };
    case "claim_unavailable":
      return {
        title: "Opening no longer available",
        detail: `${clinic} · ${service}`,
        pushTitle: "Opening no longer available",
        pushBody: "This opening is no longer available.",
        stateLabel: "Unavailable",
      };
    case "missed_opportunity":
      return {
        title: "Missed opportunity",
        detail: `${clinic} · ${service}`,
        pushTitle: "You missed an opening",
        pushBody: "A matching opening passed by. You can review what happened in the app.",
        stateLabel: "Missed",
      };
    case "standby_status_reminder":
      return {
        title: "Check your standby status",
        detail: "Review your coverage and notification readiness.",
        pushTitle: "Check your standby setup",
        pushBody: "Review your standby status and readiness.",
        stateLabel: "Status",
      };
    case "standby_setup_suggestion":
      return {
        title: "Improve your standby setup",
        detail: "A few small changes could improve your chances.",
        pushTitle: "Improve your standby setup",
        pushBody: "A few small changes could help you catch more openings.",
        stateLabel: "Suggestion",
      };
  }
}
