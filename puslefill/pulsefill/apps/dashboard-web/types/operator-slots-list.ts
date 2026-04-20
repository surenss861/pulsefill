export type OperatorSlotStatus =
  | "open"
  | "offered"
  | "claimed"
  | "booked"
  | "expired"
  | "cancelled"
  | string;

export interface OperatorSlotsListItem {
  id: string;
  status: OperatorSlotStatus;
  provider_name_snapshot?: string | null;
  provider_id?: string | null;
  service_id?: string | null;
  location_id?: string | null;
  notes?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  estimated_value_cents?: number | null;
  winning_claim?: {
    id: string;
    customer_id?: string;
    status: string;
    created_at?: string | null;
  } | null;
}

export interface OperatorOpenSlotsListResponse {
  openSlots: OperatorSlotsListItem[];
}

export type OperatorSlotsFilter =
  | "all"
  | "open"
  | "offered"
  | "claimed"
  | "booked"
  | "expired"
  | "cancelled";
