import type { PushDecision } from "./push-decision.js";
import type { PulseFillPushPayload } from "./push-payloads.js";

export type NotificationDeliveryAttemptInsert = {
  business_id: string;
  customer_id: string | null;
  open_slot_id: string | null;
  claim_id: string | null;
  type: string;
  channel: "push";
  decision: "send" | "suppress";
  status: "queued" | "suppressed";
  dedupe_key: string;
  suppression_reason: string | null;
  retryable: boolean;
  payload: PulseFillPushPayload;
  provider: string | null;
  provider_message_id: string | null;
  error_code: string | null;
  error_message: string | null;
};

export function mapPushDecisionToDeliveryAttempt(
  decision: PushDecision,
): NotificationDeliveryAttemptInsert | null {
  const payload = decision.payload;
  if (!payload) return null;

  if (decision.ok) {
    return {
      business_id: payload.business_id,
      customer_id: payload.customer_id ?? null,
      open_slot_id: payload.open_slot_id ?? null,
      claim_id: payload.claim_id ?? null,
      type: payload.type,
      channel: "push",
      decision: "send",
      status: "queued",
      dedupe_key: decision.dedupe_key,
      suppression_reason: null,
      retryable: false,
      payload,
      provider: null,
      provider_message_id: null,
      error_code: null,
      error_message: null,
    };
  }

  return {
    business_id: payload.business_id,
    customer_id: payload.customer_id ?? null,
    open_slot_id: payload.open_slot_id ?? null,
    claim_id: payload.claim_id ?? null,
    type: payload.type,
    channel: "push",
    decision: "suppress",
    status: "suppressed",
    dedupe_key: decision.dedupe_key ?? payload.dedupe_key,
    suppression_reason: decision.reason,
    retryable: decision.retryable,
    payload,
    provider: null,
    provider_message_id: null,
    error_code: null,
    error_message: null,
  };
}
