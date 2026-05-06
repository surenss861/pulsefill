export type RecoveryInsightsTopReason = {
  reason: string;
  count: number;
  label: string;
};

export type RecoveryInsightsThinService = {
  service_id: string;
  service_name: string;
  no_match_count: number;
  recovered_bookings_30d: number;
};

export type RecoveryInsightsSuggestedFocus = {
  key: string;
  headline: string;
  detail: string;
  href: string;
};

export type RecoveryInsightsData = {
  period: { days: number; label: string; start_at: string; end_at: string };
  recovered_count_30d: number;
  missed_count_30d: number;
  no_match_count_30d: number;
  top_no_match_reasons: RecoveryInsightsTopReason[];
  thin_services: RecoveryInsightsThinService[];
  delivery_failure_count_30d: number;
  average_claim_confirmation_minutes: number | null;
  suggested_focus: RecoveryInsightsSuggestedFocus;
};
