/** Canonical customer-facing event kinds (push, activity, deep links). */
export type CustomerEventKind =
  | "offer_received"
  | "offer_expiring_soon"
  | "offer_expired"
  | "claim_submitted"
  | "claim_pending_confirmation"
  | "booking_confirmed"
  | "claim_unavailable"
  | "missed_opportunity"
  | "standby_status_reminder"
  | "standby_setup_suggestion";
