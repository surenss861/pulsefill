export type OpenSlotDetail = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  location_id?: string | null;
  provider_id?: string | null;
  service_id?: string | null;
  estimated_value_cents?: number | null;
  provider_name_snapshot?: string | null;
  notes?: string | null;
  last_offer_batch_at?: string | null;
  slot_offers: Array<{
    id: string;
    customer_id: string;
    channel: string;
    status: string;
    sent_at?: string | null;
    expires_at?: string | null;
  }>;
  slot_claims: Array<{
    id: string;
    customer_id: string;
    claimed_at?: string | null;
    status: string;
  }>;
  winning_claim?: {
    id: string;
    customer_id: string;
    claimed_at?: string | null;
    status: string;
  } | null;
};
