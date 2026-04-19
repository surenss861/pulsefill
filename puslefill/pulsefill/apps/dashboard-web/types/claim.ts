export type ClaimRow = {
  open_slot_id: string;
  slot_status: string;
  provider_name_snapshot?: string | null;
  starts_at: string;
  ends_at?: string;
  estimated_value_cents?: number | null;
  winning_claim?: {
    id: string;
    customer_id: string;
    claimed_at: string | null;
    status: string;
  } | null;
};
