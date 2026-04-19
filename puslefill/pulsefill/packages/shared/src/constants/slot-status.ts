export const OPEN_SLOT_STATUSES = [
  "open",
  "offered",
  "claimed",
  "booked",
  "expired",
  "cancelled",
] as const;

export type OpenSlotStatus = (typeof OPEN_SLOT_STATUSES)[number];
