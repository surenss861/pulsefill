export interface DeliveryReliabilityResponse {
  date: string;
  timezone: string;
  summary: {
    delivered_today: number;
    failed_today: number;
    simulated_today: number;
    customers_with_push_ready: number;
    customers_with_no_push_device: number;
    customers_with_no_reachable_channel: number;
  };
  highlights: {
    top_failure_reason?: string | null;
    customers_with_repeated_failures?: number;
    slots_affected_today?: number;
  };
}
