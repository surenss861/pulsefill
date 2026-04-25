import assert from "node:assert/strict";
import test from "node:test";

import { mapProviderResultToAttemptUpdate } from "./provider-result.js";

test("mapProviderResultToAttemptUpdate maps provider success to sent update", () => {
  const update = mapProviderResultToAttemptUpdate({
    ok: true,
    provider: "apns",
    provider_message_id: "apns_msg_1",
    sent_at: "2026-04-25T12:30:00.000Z",
  });

  assert.deepEqual(update, {
    status: "sent",
    provider: "apns",
    provider_message_id: "apns_msg_1",
    error_code: null,
    error_message: null,
    updated_at: "2026-04-25T12:30:00.000Z",
  });
});

test("mapProviderResultToAttemptUpdate maps provider failure to failed update", () => {
  const update = mapProviderResultToAttemptUpdate({
    ok: false,
    provider: "expo",
    error_code: "DEVICE_UNREGISTERED",
    error_message: "Device token no longer valid.",
    failed_at: "2026-04-25T12:35:00.000Z",
    retryable: false,
  });

  assert.deepEqual(update, {
    status: "failed",
    provider: "expo",
    provider_message_id: null,
    error_code: "DEVICE_UNREGISTERED",
    error_message: "Device token no longer valid.",
    updated_at: "2026-04-25T12:35:00.000Z",
  });
});

test("mapProviderResultToAttemptUpdate preserves provider and clears opposite fields", () => {
  const sent = mapProviderResultToAttemptUpdate({
    ok: true,
    provider: "fcm",
    provider_message_id: "fcm_msg_7",
    sent_at: "2026-04-25T12:40:00.000Z",
  });
  const failed = mapProviderResultToAttemptUpdate({
    ok: false,
    provider: "test",
    error_code: "TEMP_UNAVAILABLE",
    error_message: "Test transient error.",
    failed_at: "2026-04-25T12:41:00.000Z",
    retryable: true,
  });

  assert.equal(sent.provider, "fcm");
  assert.equal(sent.error_code, null);
  assert.equal(sent.error_message, null);
  assert.equal(failed.provider, "test");
  assert.equal(failed.provider_message_id, null);
  assert.equal(failed.updated_at, "2026-04-25T12:41:00.000Z");
});
