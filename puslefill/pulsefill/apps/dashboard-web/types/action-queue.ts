export type ActionQueueKind =
  | "awaiting_confirmation"
  | "delivery_failed"
  | "retry_recommended"
  | "no_matches"
  | "offered_active"
  | "expired_unfilled"
  | "confirmed_booking";

export type ActionQueueSeverity = "high" | "medium" | "low";

export type ActionQueueAction = "confirm_booking" | "open_slot" | "inspect_logs" | "retry_offers" | "view_slot";

export type ActionQueueItem = {
  id: string;
  kind: ActionQueueKind;
  severity: ActionQueueSeverity;
  headline: string;
  description: string;
  open_slot_id: string;
  slot_status: string;
  provider_id: string | null;
  location_id: string | null;
  service_id: string | null;
  provider_name: string | null;
  service_name: string | null;
  location_name: string | null;
  customer_label: string | null;
  claim_id: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  actions: ActionQueueAction[];
};

export type ActionQueueSummary = {
  needs_action_count: number;
  review_count: number;
  resolved_count: number;
  awaiting_confirmation_count: number;
  delivery_failed_count: number;
  retry_recommended_count: number;
  customer_follow_up_due_count: number;
};

export type CustomerFollowUpQueueItem = {
  kind: "customer_follow_up_due";
  note_id: string;
  customer_id: string;
  customer_label: string;
  note_preview: string;
  follow_up_at: string;
  created_at: string;
  created_by_name: string;
};

export type ActionQueueResponse = {
  summary: ActionQueueSummary;
  sections: {
    needs_action: ActionQueueItem[];
    review: ActionQueueItem[];
    resolved: ActionQueueItem[];
  };
  customer_follow_ups: CustomerFollowUpQueueItem[];
};

export type ActionQueueFilter = "all" | "needs_action" | "review" | "resolved";
