export type ConnectAccountStatus = "not_started" | "pending" | "enabled" | "restricted" | "disabled";

export type ConnectAccountSnapshot = {
  id: string;
  business_id: string;
  stripe_account_id: string;
  status: ConnectAccountStatus;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  disabled_reason: string | null;
  requirements_currently_due: string[];
};

export type SlotPaymentStatus =
  | "requires_payment"
  | "authorized"
  | "capturing"
  | "captured"
  | "canceled"
  | "refunded"
  | "failed";
