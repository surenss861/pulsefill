export type ServiceCoverageDrilldownReasonRow = {
  reason: string;
  count: number;
  label: string;
};

export type ServiceCoverageDrilldownSuggestedAction = {
  key: string;
  label: string;
  href: string;
  priority: "primary" | "secondary";
};

export type ServiceCoverageDrilldownData = {
  service_id: string;
  service_name: string;
  period: { days: number; label: string; start_at: string; end_at: string };
  watching_customer_count: number;
  reachable_customer_count: number;
  recent_openings_30d: number;
  no_match_events_30d: number;
  top_no_match_reasons: ServiceCoverageDrilldownReasonRow[];
  suggested_action: ServiceCoverageDrilldownSuggestedAction;
};
