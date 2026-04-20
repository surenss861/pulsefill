export interface DailyOpsSummaryResponse {
  date: string;
  timezone: string;
  metrics: {
    recovered_bookings_today: number;
    recovered_revenue_cents_today: number;
    awaiting_confirmation_count: number;
    delivery_failures_today: number;
    no_matches_today: number;
    active_offered_slots_count: number;
  };
  breakdown?: {
    by_status?: Record<string, number>;
  };
}
