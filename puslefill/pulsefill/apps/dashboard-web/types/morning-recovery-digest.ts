export type MorningRecoveryDigestSectionKind =
  | "work_first"
  | "manual_follow_up"
  | "improve_coverage"
  | "later_today";

export type MorningRecoveryDigestActionType = "bulk_retry_offers" | "bulk_expire" | "open_filtered_slots";

export interface MorningRecoveryDigestSection {
  kind: MorningRecoveryDigestSectionKind;
  title: string;
  detail: string;
  count: number;
  slot_ids: string[];
  priority: "high" | "medium" | "low";
  action_type?: MorningRecoveryDigestActionType;
  action_label?: string;
}

export interface MorningRecoveryDigestSummary {
  retry_now_count: number;
  quiet_hours_ready_count: number;
  manual_follow_up_count: number;
  expand_match_pool_count: number;
}

export interface MorningRecoveryDigestResponse {
  generated_at: string;
  summary: MorningRecoveryDigestSummary;
  sections: MorningRecoveryDigestSection[];
}
