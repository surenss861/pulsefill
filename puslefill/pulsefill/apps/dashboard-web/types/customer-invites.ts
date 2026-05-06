export type CustomerInviteStatus = "pending" | "accepted" | "expired" | "revoked";

export type InviteOnboardingStatusKey =
  | "pending_invite"
  | "accepted_connection_issue"
  | "accepted_needs_standby"
  | "accepted_not_reachable"
  | "accepted_limited_reach"
  | "accepted_standby_active"
  | "expired"
  | "revoked";

export type InviteOnboardingStatus = {
  key: InviteOnboardingStatusKey;
  label: string;
  detail: string;
  tone: "neutral" | "attention" | "success" | "warning" | "muted";
  next_action?: { label: string; href: string };
};

export type CustomerInviteListItem = {
  id: string;
  code: string | null;
  invite_url: string | null;
  customer_name: string | null;
  customer_email: string;
  status: CustomerInviteStatus;
  accepted_by_customer_id: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  /** Present on current API; optional for older responses / defensive UI. */
  onboarding_status?: InviteOnboardingStatus;
};

export type CustomerInviteListResponse = {
  invites: CustomerInviteListItem[];
};

export type CustomerInviteCreateResponse = CustomerInviteListItem & {
  one_time_token: string;
  expires_in_days: number;
};
