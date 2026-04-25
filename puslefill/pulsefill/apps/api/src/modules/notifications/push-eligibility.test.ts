import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePushEligibility, isInQuietHours } from "./push-eligibility.js";

const baseInput = {
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
  type: "customer_offer_sent" as const,
  nowIso: "2026-04-25T14:00:00.000Z",
  requiredTarget: {
    customerId: "customer_1",
    openSlotId: "slot_1",
  },
  dedupeAlreadySent: false,
};

test("eligible with active push device", () => {
  const result = evaluatePushEligibility(baseInput);
  assert.deepEqual(result, {
    ok: true,
    channel: "push",
    device_token: "device_token_1",
  });
});

test("missing customer returns no_customer", () => {
  const result = evaluatePushEligibility({ ...baseInput, customer: null });
  assert.deepEqual(result, { ok: false, reason: "no_customer", retryable: false });
});

test("dedupe already sent returns no-send", () => {
  const result = evaluatePushEligibility({ ...baseInput, dedupeAlreadySent: true });
  assert.deepEqual(result, { ok: false, reason: "dedupe_already_sent", retryable: false });
});

test("customer push disabled returns push_disabled", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    customer: { ...baseInput.customer, push_enabled: false },
  });
  assert.deepEqual(result, { ok: false, reason: "push_disabled", retryable: false });
});

test("prefs push disabled returns push_disabled", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    notificationPrefs: { ...baseInput.notificationPrefs, push_enabled: false },
  });
  assert.deepEqual(result, { ok: false, reason: "push_disabled", retryable: false });
});

test("permission denied returns push_permission_denied", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    customer: { ...baseInput.customer, push_permission: "denied" },
  });
  assert.deepEqual(result, { ok: false, reason: "push_permission_denied", retryable: false });
});

test("inactive device returns no_push_device retryable", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    device: { ...baseInput.device, active: false },
  });
  assert.deepEqual(result, { ok: false, reason: "no_push_device", retryable: true });
});

test("missing token returns no_push_device retryable", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    device: { ...baseInput.device, token: null },
  });
  assert.deepEqual(result, { ok: false, reason: "no_push_device", retryable: true });
});

test("disabled notification type returns notification_type_disabled", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    notificationPrefs: { ...baseInput.notificationPrefs, disabled_types: ["customer_offer_sent"] },
  });
  assert.deepEqual(result, { ok: false, reason: "notification_type_disabled", retryable: false });
});

test("missing required target returns missing_required_target", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    requiredTarget: { customerId: "customer_1", openSlotId: null },
  });
  assert.deepEqual(result, { ok: false, reason: "missing_required_target", retryable: false });
});

test("quiet hours same-day range suppresses push", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    nowIso: "2026-04-25T13:30:00.000",
    notificationPrefs: {
      ...baseInput.notificationPrefs,
      quiet_hours_enabled: true,
      quiet_hours_start: "13:00",
      quiet_hours_end: "15:00",
    },
  });
  assert.deepEqual(result, { ok: false, reason: "quiet_hours", retryable: true });
});

test("quiet hours overnight range suppresses push", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    nowIso: "2026-04-25T23:30:00.000",
    notificationPrefs: {
      ...baseInput.notificationPrefs,
      quiet_hours_enabled: true,
      quiet_hours_start: "22:00",
      quiet_hours_end: "08:00",
    },
  });
  assert.deepEqual(result, { ok: false, reason: "quiet_hours", retryable: true });
});

test("outside quiet hours remains eligible", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    nowIso: "2026-04-25T10:30:00.000",
    notificationPrefs: {
      ...baseInput.notificationPrefs,
      quiet_hours_enabled: true,
      quiet_hours_start: "22:00",
      quiet_hours_end: "08:00",
    },
  });
  assert.deepEqual(result, {
    ok: true,
    channel: "push",
    device_token: "device_token_1",
  });
});

test("required target for claim-needed includes claim and slot", () => {
  const result = evaluatePushEligibility({
    ...baseInput,
    type: "operator_claim_needs_confirmation",
    requiredTarget: { openSlotId: "slot_1", claimId: null },
  });
  assert.deepEqual(result, { ok: false, reason: "missing_required_target", retryable: false });
});

test("isInQuietHours handles invalid clock values safely", () => {
  assert.equal(
    isInQuietHours("2026-04-25T10:00:00.000Z", {
      quiet_hours_enabled: true,
      quiet_hours_start: "bad",
      quiet_hours_end: "08:00",
    }),
    false,
  );
});
