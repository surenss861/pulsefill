import { formatPushSlotTime } from "./push-time-format.js";

function normalizeServiceName(serviceName?: string | null, fallback = "An appointment") {
  return serviceName?.trim() || fallback;
}

/** Fields shared by API orchestrator and worker offer-push delivery. */
export function buildCustomerOfferSentPushFields(input: {
  businessId: string;
  customerId: string;
  openSlotId: string;
  offerId: string;
  serviceName?: string | null;
  startsAt?: string | null;
  createdAt: string;
}): {
  type: "offer_received";
  title: string;
  body: string;
  deep_link: string;
  dedupe_key: string;
  created_at: string;
  business_id: string;
  customer_id: string;
  open_slot_id: string;
  data: Record<string, string>;
} {
  const service = normalizeServiceName(input.serviceName);
  const when = input.startsAt ? formatPushSlotTime(input.startsAt) : "soon";
  return {
    type: "offer_received",
    title: "New opening available",
    body: `${service} is available ${when}.`,
    deep_link: `/customer/offers/${input.offerId}`,
    dedupe_key: `offer_received:${input.offerId}`,
    created_at: input.createdAt,
    business_id: input.businessId,
    customer_id: input.customerId,
    open_slot_id: input.openSlotId,
    data: {
      type: "offer_received",
      business_id: input.businessId,
      customer_id: input.customerId,
      open_slot_id: input.openSlotId,
      offer_id: input.offerId,
    },
  };
}
