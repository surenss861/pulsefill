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
  /** Staff-only; not shown to customers. */
  internal_note?: string | null;
  resolution_status?: string | null;
  internal_note_updated_at?: string | null;
  last_touched_at?: string | null;
  last_touched_by_staff_id?: string | null;
  /** Joined staff row for last operator touch. */
  last_touched_by?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
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
