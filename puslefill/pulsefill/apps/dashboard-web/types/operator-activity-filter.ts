import type { OperatorActivityItem } from "@/types/operator-activity-feed";

/** Activity page filters — aligned with operator-facing language (not internal DB terms). */
export type OperatorActivityFilter =
  | "all"
  | "openings"
  | "offers"
  | "claims"
  | "notifications"
  | "notes";

export const operatorActivityFilterOptions: Array<{ value: OperatorActivityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "openings", label: "Openings" },
  { value: "offers", label: "Offers" },
  { value: "claims", label: "Claims" },
  { value: "notifications", label: "Notifications" },
  { value: "notes", label: "Notes" },
];

export function matchesOperatorActivityFilter(
  filter: OperatorActivityFilter,
  item: OperatorActivityItem,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "openings":
      return item.kind === "booking_confirmed" || item.kind === "slot_expired" || item.kind === "slot_cancelled";
    case "offers":
      return item.kind === "offers_sent" || item.kind === "offers_retry_sent" || item.kind === "offers_no_match";
    case "claims":
      return item.kind === "claim_received";
    case "notifications":
      return item.kind === "delivery_failed";
    case "notes":
      return item.kind === "internal_note_updated" || item.kind === "recovery_feedback_added";
    default:
      return true;
  }
}
