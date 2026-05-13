import { formatSlotRange } from "@/lib/format-slot-range";
import type { OperatorActivityItem, OperatorActivityKind } from "@/types/operator-activity-feed";

export type OperatorActivityEmphasis = "primary" | "danger" | "default" | "resolved";

export function operatorActivityKindEmphasis(kind: OperatorActivityKind): OperatorActivityEmphasis {
  switch (kind) {
    case "delivery_failed":
    case "offers_no_match":
    case "slot_expired":
      return "danger";
    case "claim_received":
    case "offers_retry_sent":
      return "primary";
    case "booking_confirmed":
      return "resolved";
    case "slot_cancelled":
      return "default";
    case "offers_sent":
    case "internal_note_updated":
    case "recovery_feedback_added":
    default:
      return "default";
  }
}

/** Shown on activity rows — heuristic until API sends actor. */
export function operatorActivityActorLabel(kind: OperatorActivityKind): string {
  switch (kind) {
    case "internal_note_updated":
    case "recovery_feedback_added":
    case "booking_confirmed":
      return "Operator";
    default:
      return "System";
  }
}

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

function formatActivityWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Short sentence-case title for Operations desk activity rows (not raw event codes). */
export function operatorActivityDeskHeadline(kind: OperatorActivityKind): string {
  switch (kind) {
    case "offers_sent":
      return "Offers sent";
    case "offers_retry_sent":
      return "Offers sent again";
    case "delivery_failed":
      return "Delivery failed";
    case "offers_no_match":
      return "No matches yet";
    case "claim_received":
      return "Customer claimed";
    case "booking_confirmed":
      return "Booking confirmed";
    case "slot_expired":
      return "Opening expired";
    case "slot_cancelled":
      return "Opening cancelled";
    case "internal_note_updated":
      return "Note updated";
    case "recovery_feedback_added":
      return "Feedback recorded";
    default:
      return "Activity";
  }
}

/** Service, time, and place — one readable line for staff. */
export function operatorActivityDeskContextLine(item: OperatorActivityItem): string | null {
  const parts: string[] = [];
  if (item.service_name?.trim()) parts.push(item.service_name.trim());
  const slot =
    item.starts_at && item.ends_at
      ? formatSlotRange(item.starts_at, item.ends_at)
      : item.starts_at
        ? formatActivityWhen(item.starts_at)
        : null;
  if (slot) parts.push(slot);
  if (item.location_name?.trim()) parts.push(item.location_name.trim());
  if (item.provider_name?.trim()) parts.push(item.provider_name.trim());
  if (parts.length > 0) return parts.join(" · ");
  return null;
}

/** Plain-language explanation when the API does not send `detail`. */
export function operatorActivityDeskExplanation(item: OperatorActivityItem): string {
  const detail = item.detail?.trim();
  if (detail) return detail;

  switch (item.kind) {
    case "offers_sent":
      return "Waiting customers were notified about this appointment time.";
    case "offers_retry_sent":
      return "Offers were sent again to waiting customers.";
    case "delivery_failed":
      return (
        item.latest_delivery_reason?.trim() ||
        "An offer or update could not be delivered by text or email."
      );
    case "offers_no_match":
      return "No waiting customers matched this opening yet.";
    case "claim_received":
      return (
        item.title?.trim() ||
        "Someone asked for this spot. Confirm the booking from the opening page."
      );
    case "booking_confirmed":
      return "This visit was confirmed from the waitlist.";
    case "slot_expired":
      return "The appointment time expired before it was filled.";
    case "slot_cancelled":
      return "This opening was cancelled.";
    case "internal_note_updated":
      return "Staff updated a note on this opening.";
    case "recovery_feedback_added":
      return "Recovery feedback was added.";
    default:
      return "Something changed on this opening.";
  }
}
