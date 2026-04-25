import {
  buildCustomerBookingConfirmedPush,
  buildCustomerLostOpportunityPush,
  buildCustomerOfferSentPush,
  buildCustomerStandbySetupSuggestionPush,
  buildCustomerStandbyStatusReminderPush,
  buildOperatorClaimNeedsConfirmationPush,
  type PulseFillPushPayload,
} from "./push-payloads.js";
import {
  evaluatePushEligibility,
  type PushEligibilityFailureReason,
  type PushEligibilityInput,
} from "./push-eligibility.js";

export type PushDecision =
  | {
      ok: true;
      channel: "push";
      payload: PulseFillPushPayload;
      device_token: string;
      dedupe_key: string;
    }
  | {
      ok: false;
      reason: PushEligibilityFailureReason;
      retryable: boolean;
      payload?: PulseFillPushPayload;
      dedupe_key?: string;
    };

export function decidePushDelivery(input: {
  payload: PulseFillPushPayload;
  eligibility: PushEligibilityInput;
}): PushDecision {
  const eligibility = evaluatePushEligibility(input.eligibility);
  if (!eligibility.ok) {
    return {
      ok: false,
      reason: eligibility.reason,
      retryable: eligibility.retryable,
      payload: input.payload,
      dedupe_key: input.payload.dedupe_key,
    };
  }
  return {
    ok: true,
    channel: "push",
    payload: input.payload,
    device_token: eligibility.device_token,
    dedupe_key: input.payload.dedupe_key,
  };
}

export function decideCustomerOfferSentPush(input: {
  payloadInput: Parameters<typeof buildCustomerOfferSentPush>[0];
  eligibilityInput: Omit<PushEligibilityInput, "type" | "requiredTarget">;
}): PushDecision {
  const payload = buildCustomerOfferSentPush(input.payloadInput);
  return decidePushDelivery({
    payload,
    eligibility: {
      ...input.eligibilityInput,
      type: payload.type,
      requiredTarget: {
        customerId: payload.customer_id ?? null,
        openSlotId: payload.open_slot_id ?? null,
      },
    },
  });
}

export function decideCustomerBookingConfirmedPush(input: {
  payloadInput: Parameters<typeof buildCustomerBookingConfirmedPush>[0];
  eligibilityInput: Omit<PushEligibilityInput, "type" | "requiredTarget">;
}): PushDecision {
  const payload = buildCustomerBookingConfirmedPush(input.payloadInput);
  return decidePushDelivery({
    payload,
    eligibility: {
      ...input.eligibilityInput,
      type: payload.type,
      requiredTarget: {
        customerId: payload.customer_id ?? null,
        openSlotId: payload.open_slot_id ?? null,
        claimId: payload.claim_id ?? null,
      },
    },
  });
}

export function decideOperatorClaimNeedsConfirmationPush(input: {
  payloadInput: Parameters<typeof buildOperatorClaimNeedsConfirmationPush>[0];
  eligibilityInput: Omit<PushEligibilityInput, "type" | "requiredTarget">;
}): PushDecision {
  const payload = buildOperatorClaimNeedsConfirmationPush(input.payloadInput);
  return decidePushDelivery({
    payload,
    eligibility: {
      ...input.eligibilityInput,
      type: payload.type,
      requiredTarget: {
        customerId: payload.customer_id ?? null,
        openSlotId: payload.open_slot_id ?? null,
        claimId: payload.claim_id ?? null,
      },
    },
  });
}

export function decideCustomerLostOpportunityPush(input: {
  payloadInput: Parameters<typeof buildCustomerLostOpportunityPush>[0];
  eligibilityInput: Omit<PushEligibilityInput, "type" | "requiredTarget">;
}): PushDecision {
  const payload = buildCustomerLostOpportunityPush(input.payloadInput);
  return decidePushDelivery({
    payload,
    eligibility: {
      ...input.eligibilityInput,
      type: payload.type,
      requiredTarget: {
        customerId: payload.customer_id ?? null,
        openSlotId: payload.open_slot_id ?? null,
        claimId: payload.claim_id ?? null,
      },
    },
  });
}

export function decideCustomerStandbySetupSuggestionPush(input: {
  payloadInput: Parameters<typeof buildCustomerStandbySetupSuggestionPush>[0];
  eligibilityInput: Omit<PushEligibilityInput, "type" | "requiredTarget">;
}): PushDecision {
  const payload = buildCustomerStandbySetupSuggestionPush(input.payloadInput);
  return decidePushDelivery({
    payload,
    eligibility: {
      ...input.eligibilityInput,
      type: payload.type,
      requiredTarget: {
        customerId: payload.customer_id ?? null,
      },
    },
  });
}

export function decideCustomerStandbyStatusReminderPush(input: {
  payloadInput: Parameters<typeof buildCustomerStandbyStatusReminderPush>[0];
  eligibilityInput: Omit<PushEligibilityInput, "type" | "requiredTarget">;
}): PushDecision {
  const payload = buildCustomerStandbyStatusReminderPush(input.payloadInput);
  return decidePushDelivery({
    payload,
    eligibility: {
      ...input.eligibilityInput,
      type: payload.type,
      requiredTarget: {
        customerId: payload.customer_id ?? null,
      },
    },
  });
}
