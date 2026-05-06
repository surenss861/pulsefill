export type CustomerTimelineItemKind =
  | "customer_joined_business"
  | "standby_preferences_saved"
  | "opening_alert_sent"
  | "claim_submitted"
  | "claim_confirmed"
  | "internal_note_added"
  | "follow_up_scheduled"
  | "follow_up_completed";

export type CustomerTimelineSeverity = "info" | "attention" | "success" | "muted";

export type CustomerTimelineItem = {
  id: string;
  kind: CustomerTimelineItemKind;
  title: string;
  description: string;
  occurred_at: string;
  source: "membership" | "standby" | "notification" | "claim" | "note";
  severity: CustomerTimelineSeverity;
  metadata: Record<string, string>;
};

export type CustomerTimelineResponse = {
  customer_id: string;
  items: CustomerTimelineItem[];
};
