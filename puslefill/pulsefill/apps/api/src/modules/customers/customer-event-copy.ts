import { getCustomerPushCopy } from "@pulsefill/shared";

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
  const push = getCustomerPushCopy(input.kind, {
    businessName: input.businessName,
    serviceName: input.serviceName,
  });

  switch (input.kind) {
    case "offer_received":
      return {
        title: "Offer received",
        detail: `${clinic} · ${service}`,
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "New offer",
      };
    case "offer_expiring_soon":
      return {
        title: "Offer expiring soon",
        detail: `${clinic} · ${service}`,
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Expiring soon",
      };
    case "offer_expired":
      return {
        title: "Offer expired",
        detail: `${clinic} · ${service}`,
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Expired",
      };
    case "claim_submitted":
      return {
        title: "Claim submitted",
        detail: "We sent your claim right away.",
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Submitted",
      };
    case "claim_pending_confirmation":
      return {
        title: "Waiting for clinic confirmation",
        detail: "The clinic still needs to confirm the booking.",
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Pending confirmation",
      };
    case "booking_confirmed":
      return {
        title: "Booking confirmed",
        detail: `${clinic} confirmed your opening.`,
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Confirmed",
      };
    case "claim_unavailable":
      return {
        title: "Opening no longer available",
        detail: `${clinic} · ${service}`,
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Unavailable",
      };
    case "missed_opportunity":
      return {
        title: "Missed opportunity",
        detail: `${clinic} · ${service}`,
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Missed",
      };
    case "standby_status_reminder":
      return {
        title: "Check your standby status",
        detail: "Review your coverage and notification readiness.",
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Status",
      };
    case "standby_setup_suggestion":
      return {
        title: "Improve your standby setup",
        detail: "A few small changes could improve your chances.",
        pushTitle: push.title,
        pushBody: push.body,
        stateLabel: "Suggestion",
      };
  }
}
