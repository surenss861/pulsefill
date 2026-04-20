import type { OperatorActivityItem } from "@/types/operator-activity-feed";

export type OperatorActivityFilter =
  | "all"
  | "delivery"
  | "claims"
  | "bookings"
  | "coverage"
  | "notes";

export const operatorActivityFilterOptions: Array<{ value: OperatorActivityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "delivery", label: "Delivery" },
  { value: "claims", label: "Claims" },
  { value: "bookings", label: "Bookings" },
  { value: "coverage", label: "Coverage" },
  { value: "notes", label: "Notes" },
];

export function matchesOperatorActivityFilter(
  filter: OperatorActivityFilter,
  item: OperatorActivityItem,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "delivery":
      return (
        item.kind === "offers_sent" ||
        item.kind === "offers_retry_sent" ||
        item.kind === "delivery_failed"
      );
    case "claims":
      return item.kind === "claim_received";
    case "bookings":
      return (
        item.kind === "booking_confirmed" ||
        item.kind === "slot_expired" ||
        item.kind === "slot_cancelled"
      );
    case "coverage":
      return item.kind === "offers_no_match";
    case "notes":
      return item.kind === "internal_note_updated" || item.kind === "recovery_feedback_added";
    default:
      return true;
  }
}
