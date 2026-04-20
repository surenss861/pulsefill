export interface OperatorCustomerContextResponse {
  customer: {
    id: string;
    display_name: string | null;
    email_masked: string | null;
    phone_masked: string | null;
    push_enabled: boolean;
    sms_enabled: boolean;
    email_enabled: boolean;
  };
  standby_preferences: OperatorStandbyPreferenceSnapshot[];
  delivery_context: {
    push_devices_count: number;
    has_push_ready: boolean;
    has_email: boolean;
    has_sms: boolean;
    has_any_reachable_channel: boolean;
    last_failed_delivery_at: string | null;
    last_failed_delivery_reason: string | null;
  };
}

export interface OperatorStandbyPreferenceSnapshot {
  id: string;
  active: boolean;
  business_name: string | null;
  service_name: string | null;
  location_name: string | null;
  provider_name: string | null;
  days_of_week: number[];
  earliest_time: string | null;
  latest_time: string | null;
  max_notice_hours: number | null;
  deposit_ok: boolean;
}
