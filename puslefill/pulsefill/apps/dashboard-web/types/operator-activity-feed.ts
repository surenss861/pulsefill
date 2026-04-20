export type OperatorActivityKind =
  | "offers_sent"
  | "offers_retry_sent"
  | "delivery_failed"
  | "offers_no_match"
  | "claim_received"
  | "booking_confirmed"
  | "slot_expired"
  | "slot_cancelled"
  | "internal_note_updated"
  | "recovery_feedback_added";

export type OperatorActivityRowAction = "retry_now" | "add_note" | "add_feedback" | "open_detail";

export type OperatorActivityBulkActionType = "retry_offers" | "feedback";

export interface OperatorActivityItem {
  id: string;
  kind: OperatorActivityKind;
  title: string;
  detail?: string | null;
  occurred_at: string;
  open_slot_id?: string | null;
  slot_status?: string | null;
  business_name?: string | null;
  service_name?: string | null;
  provider_name?: string | null;
  location_name?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  priority_band?: "high" | "medium" | "low" | null;
  priority_summary?: string | null;
  recovery_recommendation_title?: string | null;
  recovery_recommendation_kind?: string | null;
  latest_delivery_outcome?: "delivered" | "failed" | "suppressed" | "skipped_no_channel" | null;
  latest_delivery_reason?: string | null;
  latest_feedback_value?: string | null;
  has_internal_note?: boolean | null;
  available_actions?: OperatorActivityRowAction[];
  bulk_selectable?: boolean;
  bulk_action_types?: OperatorActivityBulkActionType[];
}

export interface OperatorActivityFeedResponse {
  items: OperatorActivityItem[];
}
