export const OFFER_STATUSES = [
  "sent",
  "delivered",
  "viewed",
  "claimed",
  "expired",
  "failed",
  "cancelled",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];
