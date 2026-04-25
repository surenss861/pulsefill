export type NotificationAttemptRow = {
  id: string;
  type: string;
  status: "queued" | "suppressed" | "sent" | "failed" | string;
  decision: "send" | "suppress" | string;
  suppression_reason: string | null;
  retryable: boolean;
  dedupe_key: string;
  open_slot_id: string | null;
  customer_id: string | null;
  claim_id: string | null;
  provider: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
