export type ActionErrorCode =
  | "claim_mismatch"
  | "slot_not_claimed"
  | "slot_terminal_state"
  | "slot_already_claimed"
  | "slot_already_booked"
  | "slot_expired"
  | "slot_cancelled"
  | "operator_action_not_allowed"
  | "forbidden"
  | "not_found"
  | "invalid_request"
  | "server_error";

export type ActionErrorBody = {
  error: {
    code: ActionErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
};

export type ConfirmSuccessResponse = {
  ok: true;
  result: "confirmed" | "already_confirmed";
  open_slot_id: string;
  claim_id: string;
  status: "booked";
  message: string;
};

export type SendOffersSuccessResponse = {
  ok: true;
  result: "offers_sent" | "offers_retried" | "no_matches";
  open_slot_id: string;
  matched: number;
  offer_ids: string[];
  message: string;
  /** Present when offers were created (not for no_matches). */
  notification_queue?: { queued: boolean; count: number };
};
