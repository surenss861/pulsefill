import type { OperatorActivityKind } from "@/types/operator-activity-feed";

export function operatorActivityKindLabel(kind: OperatorActivityKind): string {
  switch (kind) {
    case "offers_sent":
      return "Offers sent";
    case "offers_retry_sent":
      return "Retry sent";
    case "delivery_failed":
      return "Delivery failed";
    case "offers_no_match":
      return "No matches";
    case "claim_received":
      return "Claim received";
    case "booking_confirmed":
      return "Booking confirmed";
    case "slot_expired":
      return "Expired";
    case "slot_cancelled":
      return "Cancelled";
    case "internal_note_updated":
      return "Internal note updated";
    case "recovery_feedback_added":
      return "Feedback";
    default:
      return "Activity";
  }
}

export function operatorActivityKindAccentColor(kind: OperatorActivityKind): string {
  switch (kind) {
    case "delivery_failed":
    case "offers_no_match":
      return "#fbbf24";
    case "booking_confirmed":
      return "#4ade80";
    case "internal_note_updated":
    case "recovery_feedback_added":
      return "var(--muted)";
    default:
      return "#38bdf8";
  }
}
