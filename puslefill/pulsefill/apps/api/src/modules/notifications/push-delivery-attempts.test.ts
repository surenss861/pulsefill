import assert from "node:assert/strict";
import test from "node:test";

import { decideCustomerOfferSentPush } from "./push-decision.js";
import { mapPushDecisionToDeliveryAttempt } from "./push-delivery-attempts.js";

const baseDecisionInput = {
  payloadInput: {
    businessId: "11111111-1111-4111-8111-111111111111",
    customerId: "22222222-2222-4222-8222-222222222222",
    openSlotId: "33333333-3333-4333-8333-333333333333",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  },
  eligibilityInput: {
    customer: {
      id: "22222222-2222-4222-8222-222222222222",
      push_enabled: true,
      push_permission: "granted" as const,
    },
    device: {
      token: "device_token_1",
      platform: "ios" as const,
      active: true,
    },
    notificationPrefs: {
      push_enabled: true,
      disabled_types: [],
      quiet_hours_enabled: false,
    },
    nowIso: "2026-04-25T14:00:00.000",
    dedupeAlreadySent: false,
  },
};

test("mapPushDecisionToDeliveryAttempt maps eligible decision to queued send row", () => {
  const decision = decideCustomerOfferSentPush(baseDecisionInput);
  assert.equal(decision.ok, true);

  const attempt = mapPushDecisionToDeliveryAttempt(decision);
  assert.ok(attempt);
  assert.equal(attempt?.decision, "send");
  assert.equal(attempt?.status, "queued");
  assert.equal(attempt?.dedupe_key, "offer_received:offer_1");
  assert.equal(attempt?.business_id, "11111111-1111-4111-8111-111111111111");
  assert.equal(attempt?.customer_id, "22222222-2222-4222-8222-222222222222");
  assert.equal(attempt?.open_slot_id, "33333333-3333-4333-8333-333333333333");
  assert.equal(attempt?.retryable, false);
  assert.equal(attempt?.suppression_reason, null);
  assert.equal(attempt?.provider, null);
  assert.equal(attempt?.provider_message_id, null);
  assert.equal(attempt?.error_code, null);
  assert.equal(attempt?.error_message, null);
  assert.equal(attempt?.payload.type, "offer_received");
});

test("mapPushDecisionToDeliveryAttempt maps suppressed decision with reason and retryability", () => {
  const decision = decideCustomerOfferSentPush({
    ...baseDecisionInput,
    eligibilityInput: {
      ...baseDecisionInput.eligibilityInput,
      customer: {
        ...baseDecisionInput.eligibilityInput.customer,
        push_permission: "denied",
      },
    },
  });
  assert.equal(decision.ok, false);

  const attempt = mapPushDecisionToDeliveryAttempt(decision);
  assert.ok(attempt);
  assert.equal(attempt?.decision, "suppress");
  assert.equal(attempt?.status, "suppressed");
  assert.equal(attempt?.suppression_reason, "push_permission_denied");
  assert.equal(attempt?.retryable, false);
  assert.equal(attempt?.dedupe_key, "offer_received:offer_1");
  assert.equal(attempt?.payload.type, "offer_received");
  assert.equal(attempt?.provider, null);
  assert.equal(attempt?.provider_message_id, null);
});

test("mapPushDecisionToDeliveryAttempt preserves retryable suppression states", () => {
  const decision = decideCustomerOfferSentPush({
    ...baseDecisionInput,
    eligibilityInput: {
      ...baseDecisionInput.eligibilityInput,
      device: {
        ...baseDecisionInput.eligibilityInput.device,
        token: null,
      },
    },
  });
  assert.equal(decision.ok, false);

  const attempt = mapPushDecisionToDeliveryAttempt(decision);
  assert.ok(attempt);
  assert.equal(attempt?.status, "suppressed");
  assert.equal(attempt?.suppression_reason, "no_push_device");
  assert.equal(attempt?.retryable, true);
});

test("mapPushDecisionToDeliveryAttempt returns null if suppressed decision has no payload", () => {
  const attempt = mapPushDecisionToDeliveryAttempt({
    ok: false,
    reason: "dedupe_already_sent",
    retryable: false,
  });
  assert.equal(attempt, null);
});
