export interface OpsBreakdownRow {
  id: string;
  label: string;
  recovered_bookings: number;
  recovered_revenue_cents: number;
  awaiting_confirmation: number;
  active_offered_slots: number;
  delivery_failures: number;
  no_matches: number;
}

export interface OpsBreakdownResponse {
  date_range: {
    label: string;
    start_at: string;
    end_at: string;
  };
  providers: OpsBreakdownRow[];
  services: OpsBreakdownRow[];
  locations: OpsBreakdownRow[];
  highlights: {
    top_provider_by_recovered_bookings?: string | null;
    top_service_by_no_matches?: string | null;
    top_location_by_failures?: string | null;
  };
}
