import type { OperatorSlotsFilter, OperatorSlotsListItem } from "@/types/operator-slots-list";

export const OPERATOR_SLOT_FILTERS: { key: OperatorSlotsFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "offered", label: "Offered" },
  { key: "claimed", label: "Claimed" },
  { key: "booked", label: "Booked" },
  { key: "expired", label: "Expired" },
  { key: "cancelled", label: "Cancelled" },
];

export function matchesOperatorSlotFilter(slot: OperatorSlotsListItem, filter: OperatorSlotsFilter) {
  if (filter === "all") return true;
  return (slot.status || "").toLowerCase() === filter;
}

export function getOperatorSlotCounts(slots: OperatorSlotsListItem[]) {
  const counts: Record<string, number> = {
    all: slots.length,
    open: 0,
    offered: 0,
    claimed: 0,
    booked: 0,
    expired: 0,
    cancelled: 0,
  };

  for (const slot of slots) {
    const key = (slot.status || "").toLowerCase();
    if (key in counts) counts[key] += 1;
  }

  return counts;
}

export function getOperatorSlotAttentionLabel(slot: OperatorSlotsListItem) {
  const st = (slot.status || "").toLowerCase();
  if (st === "open") {
    return "Waiting for offers";
  }
  if (st === "claimed") {
    return "Awaiting confirmation";
  }
  if (st === "offered") {
    return "Offers sent — waiting on replies";
  }
  return null;
}

export function getOperatorSlotEmptyCopy(filter: OperatorSlotsFilter) {
  switch (filter) {
    case "open":
      return "No openings are waiting for offers in this view.";
    case "offered":
      return "No openings have active offers right now.";
    case "claimed":
      return "No openings are waiting for you to confirm the booking.";
    case "booked":
      return "No confirmed bookings in this view yet.";
    case "expired":
      return "No expired appointment times here.";
    case "cancelled":
      return "No cancelled appointment times here.";
    default:
      return "No openings match this view.";
  }
}
