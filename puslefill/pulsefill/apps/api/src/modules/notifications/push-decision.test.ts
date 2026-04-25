import assert from "node:assert/strict";
import test from "node:test";

import {
  decideCustomerOfferSentPush,
  decideOperatorClaimNeedsConfirmationPush,
  decidePushDelivery,
} from "./push-decision.js";
import { buildCustomerOfferSentPush } from "./push-payloads.js";

const baseEligibility = {
  customer: {
    id: "customer_1",
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
};

test("decidePushDelivery returns send decision when eligible", () => {
  const payload = buildCustomerOfferSentPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  const decision = decidePushDelivery({
    payload,
    eligibility: {
      ...baseEligibility,
      type: payload.type,
      requiredTarget: { customerId: "customer_1", openSlotId: "slot_1" },
    },
  });

  assert.equal(decision.ok, true);
  if (!decision.ok) return;
  assert.equal(decision.channel, "push");
  assert.equal(decision.device_token, "device_token_1");
  assert.equal(decision.dedupe_key, payload.dedupe_key);
  assert.equal(decision.payload.deep_link, "/customer/offers/offer_1");
});

test("decidePushDelivery suppression preserves payload and dedupe for push denied", () => {
  const payload = buildCustomerOfferSentPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  const decision = decidePushDelivery({
    payload,
    eligibility: {
      ...baseEligibility,
      customer: { ...baseEligibility.customer, push_permission: "denied" },
      type: payload.type,
      requiredTarget: { customerId: "customer_1", openSlotId: "slot_1" },
    },
  });

  assert.deepEqual(
    { ok: decision.ok, reason: decision.ok ? undefined : decision.reason, retryable: decision.ok ? undefined : decision.retryable },
    { ok: false, reason: "push_permission_denied", retryable: false },
  );
  if (decision.ok) return;
  assert.equal(decision.dedupe_key, payload.dedupe_key);
  assert.equal(decision.payload?.type, payload.type);
});

test("decidePushDelivery suppression for quiet hours is retryable", () => {
  const payload = buildCustomerOfferSentPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  const decision = decidePushDelivery({
    payload,
    eligibility: {
      ...baseEligibility,
      nowIso: "2026-04-25T23:30:00.000",
      notificationPrefs: {
        ...baseEligibility.notificationPrefs,
        quiet_hours_enabled: true,
        quiet_hours_start: "22:00",
        quiet_hours_end: "08:00",
      },
      type: payload.type,
      requiredTarget: { customerId: "customer_1", openSlotId: "slot_1" },
    },
  });

  assert.equal(decision.ok, false);
  if (decision.ok) return;
  assert.equal(decision.reason, "quiet_hours");
  assert.equal(decision.retryable, true);
  assert.equal(decision.dedupe_key, payload.dedupe_key);
});

test("decidePushDelivery suppression for dedupe already sent is non-retryable", () => {
  const payload = buildCustomerOfferSentPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  const decision = decidePushDelivery({
    payload,
    eligibility: {
      ...baseEligibility,
      dedupeAlreadySent: true,
      type: payload.type,
      requiredTarget: { customerId: "customer_1", openSlotId: "slot_1" },
    },
  });

  assert.equal(decision.ok, false);
  if (decision.ok) return;
  assert.equal(decision.reason, "dedupe_already_sent");
  assert.equal(decision.retryable, false);
});

test("decidePushDelivery suppression for missing required target", () => {
  const payload = buildCustomerOfferSentPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  const decision = decidePushDelivery({
    payload,
    eligibility: {
      ...baseEligibility,
      type: payload.type,
      requiredTarget: { customerId: "customer_1", openSlotId: null },
    },
  });

  assert.equal(decision.ok, false);
  if (decision.ok) return;
  assert.equal(decision.reason, "missing_required_target");
  assert.equal(decision.retryable, false);
});

test("decidePushDelivery suppression for no device token", () => {
  const payload = buildCustomerOfferSentPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  const decision = decidePushDelivery({
    payload,
    eligibility: {
      ...baseEligibility,
      device: { ...baseEligibility.device, token: null },
      type: payload.type,
      requiredTarget: { customerId: "customer_1", openSlotId: "slot_1" },
    },
  });

  assert.equal(decision.ok, false);
  if (decision.ok) return;
  assert.equal(decision.reason, "no_push_device");
  assert.equal(decision.retryable, true);
});

test("decideCustomerOfferSentPush composes builder and eligibility", () => {
  const decision = decideCustomerOfferSentPush({
    payloadInput: {
      businessId: "business_1",
      customerId: "customer_1",
      openSlotId: "slot_1",
      offerId: "offer_1",
      serviceName: "Dental cleaning",
      startsAt: "2026-04-25T18:00:00.000Z",
      createdAt: "2026-04-25T12:00:00.000Z",
    },
    eligibilityInput: baseEligibility,
  });

  assert.equal(decision.ok, true);
  if (!decision.ok) return;
  assert.equal(decision.payload.type, "customer_offer_sent");
  assert.equal(decision.payload.deep_link, "/customer/offers/offer_1");
  assert.equal(decision.dedupe_key, "customer_offer_sent:offer_1");
});

test("decideOperatorClaimNeedsConfirmationPush preserves payload contract", () => {
  const decision = decideOperatorClaimNeedsConfirmationPush({
    payloadInput: {
      businessId: "business_1",
      openSlotId: "slot_1",
      claimId: "claim_1",
      customerId: "customer_1",
      serviceName: "Dental cleaning",
      startsAt: "2026-04-25T18:00:00.000Z",
      createdAt: "2026-04-25T12:00:00.000Z",
    },
    eligibilityInput: baseEligibility,
  });

  assert.equal(decision.ok, true);
  if (!decision.ok) return;
  assert.equal(decision.payload.type, "operator_claim_needs_confirmation");
  assert.equal(decision.payload.deep_link, "/open-slots/slot_1?from=push");
  assert.equal(decision.dedupe_key, "operator_claim_needs_confirmation:claim_1");
});
