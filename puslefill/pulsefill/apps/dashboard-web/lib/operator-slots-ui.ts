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
  if (st === "claimed") {
    return "Awaiting confirmation";
  }
  if (st === "offered") {
    return "Offers active";
  }
  return null;
}

export function getOperatorSlotEmptyCopy(filter: OperatorSlotsFilter) {
  switch (filter) {
    case "open":
      return "No openings currently open.";
    case "offered":
      return "No offered openings right now.";
    case "claimed":
      return "No claimed openings awaiting confirmation.";
    case "booked":
      return "No booked openings yet.";
    case "expired":
      return "No expired openings yet.";
    case "cancelled":
      return "No cancelled openings.";
    default:
      return "No openings yet.";
  }
}
