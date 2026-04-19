export type NotificationLogRow = {
  id: string;
  customer_id?: string | null;
  open_slot_id?: string | null;
  slot_offer_id?: string | null;
  channel: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};
