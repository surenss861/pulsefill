export type PulseFillPushType =
  | "customer_offer_sent"
  | "customer_offer_expiring_soon"
  | "customer_booking_confirmed"
  | "customer_lost_opportunity"
  | "customer_standby_setup_suggestion"
  | "customer_standby_status_reminder"
  | "operator_claim_needs_confirmation"
  | "operator_delivery_failure";

export type PulseFillPushPayload = {
  type: PulseFillPushType;
  title: string;
  body: string;
  deep_link: string;
  dedupe_key: string;
  created_at: string;
  business_id: string;
  open_slot_id?: string;
  claim_id?: string;
  customer_id?: string;
  actor?: "system" | "operator" | "customer";
  data: Record<string, string>;
};

function normalizeServiceName(serviceName?: string | null, fallback = "An appointment") {
  return serviceName?.trim() || fallback;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function formatPushSlotTime(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "soon";
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  }).format(date);
}

export function buildCustomerOfferSentPush(input: {
  businessId: string;
  customerId: string;
  openSlotId: string;
  offerId: string;
  serviceName?: string | null;
  startsAt?: string | null;
  createdAt: string;
}): PulseFillPushPayload {
  const service = normalizeServiceName(input.serviceName);
  const when = input.startsAt ? formatPushSlotTime(input.startsAt) : "soon";
  return {
    type: "customer_offer_sent",
    title: "New opening available",
    body: `${service} is available ${when}.`,
    deep_link: `/customer/offers/${input.offerId}`,
    dedupe_key: `customer_offer_sent:${input.offerId}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    customer_id: input.customerId,
    open_slot_id: input.openSlotId,
    actor: "system",
    data: {
      type: "customer_offer_sent",
      business_id: input.businessId,
      customer_id: input.customerId,
      open_slot_id: input.openSlotId,
      offer_id: input.offerId,
    },
  };
}

export function buildCustomerBookingConfirmedPush(input: {
  businessId: string;
  customerId: string;
  openSlotId: string;
  claimId: string;
  serviceName?: string | null;
  startsAt?: string | null;
  createdAt: string;
}): PulseFillPushPayload {
  const service = normalizeServiceName(input.serviceName, "Your appointment");
  const when = input.startsAt ? formatPushSlotTime(input.startsAt) : "soon";
  return {
    type: "customer_booking_confirmed",
    title: "Booking confirmed",
    body: `${service} is confirmed for ${when}.`,
    deep_link: `/customer/claims/${input.claimId}`,
    dedupe_key: `customer_booking_confirmed:${input.claimId}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    customer_id: input.customerId,
    open_slot_id: input.openSlotId,
    claim_id: input.claimId,
    actor: "operator",
    data: {
      type: "customer_booking_confirmed",
      business_id: input.businessId,
      customer_id: input.customerId,
      open_slot_id: input.openSlotId,
      claim_id: input.claimId,
    },
  };
}

export function buildOperatorClaimNeedsConfirmationPush(input: {
  businessId: string;
  openSlotId: string;
  claimId: string;
  customerId?: string | null;
  serviceName?: string | null;
  startsAt?: string | null;
  createdAt: string;
}): PulseFillPushPayload {
  const service = normalizeServiceName(input.serviceName, "An opening");
  const when = input.startsAt ? formatPushSlotTime(input.startsAt) : "soon";
  return {
    type: "operator_claim_needs_confirmation",
    title: "Claim needs confirmation",
    body: `${service} for ${when} is waiting for confirmation.`,
    deep_link: `/open-slots/${input.openSlotId}?from=push`,
    dedupe_key: `operator_claim_needs_confirmation:${input.claimId}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    open_slot_id: input.openSlotId,
    claim_id: input.claimId,
    customer_id: input.customerId ?? undefined,
    actor: "system",
    data: {
      type: "operator_claim_needs_confirmation",
      business_id: input.businessId,
      open_slot_id: input.openSlotId,
      claim_id: input.claimId,
      ...(input.customerId ? { customer_id: input.customerId } : {}),
    },
  };
}

export function buildCustomerLostOpportunityPush(input: {
  businessId: string;
  customerId: string;
  openSlotId: string;
  claimId?: string | null;
  serviceName?: string | null;
  createdAt: string;
}): PulseFillPushPayload {
  const service = normalizeServiceName(input.serviceName, "That opening");
  const deepLink = input.claimId ? `/customer/claims/${input.claimId}` : "/customer/standby";
  const dedupeKey = input.claimId
    ? `customer_lost_opportunity:${input.claimId}`
    : `customer_lost_opportunity:${input.openSlotId}:${input.customerId}`;

  return {
    type: "customer_lost_opportunity",
    title: "Opening no longer available",
    body: `${service} is no longer available.`,
    deep_link: deepLink,
    dedupe_key: dedupeKey,
    created_at: input.createdAt,
    business_id: input.businessId,
    customer_id: input.customerId,
    open_slot_id: input.openSlotId,
    claim_id: input.claimId ?? undefined,
    actor: "system",
    data: {
      type: "customer_lost_opportunity",
      business_id: input.businessId,
      customer_id: input.customerId,
      open_slot_id: input.openSlotId,
      ...(input.claimId ? { claim_id: input.claimId } : {}),
    },
  };
}

export function buildCustomerStandbySetupSuggestionPush(input: {
  businessId: string;
  customerId: string;
  createdAt: string;
}): PulseFillPushPayload {
  return {
    type: "customer_standby_setup_suggestion",
    title: "Set up standby alerts",
    body: "Choose how you want to hear about earlier openings.",
    deep_link: "/customer/standby",
    dedupe_key: `customer_standby_setup_suggestion:${input.businessId}:${input.customerId}:${dayKey(input.createdAt)}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    customer_id: input.customerId,
    actor: "system",
    data: {
      type: "customer_standby_setup_suggestion",
      business_id: input.businessId,
      customer_id: input.customerId,
    },
  };
}

export function buildCustomerStandbyStatusReminderPush(input: {
  businessId: string;
  customerId: string;
  createdAt: string;
}): PulseFillPushPayload {
  return {
    type: "customer_standby_status_reminder",
    title: "Standby is ready",
    body: "You are set up for earlier-opening alerts.",
    deep_link: "/customer/standby",
    dedupe_key: `customer_standby_status_reminder:${input.businessId}:${input.customerId}:${dayKey(input.createdAt)}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    customer_id: input.customerId,
    actor: "system",
    data: {
      type: "customer_standby_status_reminder",
      business_id: input.businessId,
      customer_id: input.customerId,
    },
  };
}

export function buildCustomerOfferExpiringSoonPush(input: {
  businessId: string;
  customerId: string;
  openSlotId: string;
  offerId: string;
  claimId?: string | null;
  serviceName?: string | null;
  createdAt: string;
}): PulseFillPushPayload {
  const service = normalizeServiceName(input.serviceName, "This opening");
  return {
    type: "customer_offer_expiring_soon",
    title: "Opening expires soon",
    body: `${service} may be claimed soon.`,
    deep_link: `/customer/offers/${input.offerId}`,
    dedupe_key: `customer_offer_expiring_soon:${input.offerId}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    customer_id: input.customerId,
    open_slot_id: input.openSlotId,
    claim_id: input.claimId ?? undefined,
    actor: "system",
    data: {
      type: "customer_offer_expiring_soon",
      business_id: input.businessId,
      customer_id: input.customerId,
      open_slot_id: input.openSlotId,
      offer_id: input.offerId,
      ...(input.claimId ? { claim_id: input.claimId } : {}),
    },
  };
}

export function buildOperatorDeliveryFailurePush(input: {
  businessId: string;
  openSlotId: string;
  serviceName?: string | null;
  createdAt: string;
}): PulseFillPushPayload {
  const service = normalizeServiceName(input.serviceName, "An opening");
  return {
    type: "operator_delivery_failure",
    title: "Delivery issue detected",
    body: `${service} has a delivery issue that may need review.`,
    deep_link: `/open-slots/${input.openSlotId}?from=push`,
    dedupe_key: `operator_delivery_failure:${input.openSlotId}:${dayKey(input.createdAt)}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    open_slot_id: input.openSlotId,
    actor: "system",
    data: {
      type: "operator_delivery_failure",
      business_id: input.businessId,
      open_slot_id: input.openSlotId,
    },
  };
}
