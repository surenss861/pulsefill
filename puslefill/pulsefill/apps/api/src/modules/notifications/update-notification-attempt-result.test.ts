import assert from "node:assert/strict";
import test from "node:test";

import {
  updateNotificationAttemptResult,
  type SupabaseClientLike,
} from "./update-notification-attempt-result.js";

function fakeSupabase(result: {
  data: { id: string } | null;
  error: { code?: string; message?: string } | null;
  capture?: (row: unknown, id: string) => void;
}): SupabaseClientLike {
  return {
    from: (table: string) => {
      assert.equal(table, "notification_delivery_attempts");
      return {
        update: (row: unknown) => ({
          eq: (field: string, value: string) => {
            assert.equal(field, "id");
            result.capture?.(row, value);
            return {
              select: (fields: string) => {
                assert.equal(fields, "id");
                return {
                  maybeSingle: async () => ({ data: result.data, error: result.error }),
                };
              },
            };
          },
        }),
      };
    },
  };
}

test("updateNotificationAttemptResult writes sent update row", async () => {
  let captured: Record<string, unknown> | null = null;
  let capturedId: string | null = null;
  const out = await updateNotificationAttemptResult({
    supabase: fakeSupabase({
      data: { id: "attempt_1" },
      error: null,
      capture: (row, id) => {
        captured = row as Record<string, unknown>;
        capturedId = id;
      },
    }),
    attemptId: "attempt_1",
    result: {
      ok: true,
      provider: "apns",
      provider_message_id: "apns_msg_123",
      sent_at: "2026-04-25T13:00:00.000Z",
    },
  });

  assert.deepEqual(out, { updated: true, attempt_id: "attempt_1" });
  assert.equal(capturedId, "attempt_1");
  assert.ok(captured);
  assert.equal(captured["status"], "sent");
  assert.equal(captured["provider"], "apns");
  assert.equal(captured["provider_message_id"], "apns_msg_123");
  assert.equal(captured["error_code"], null);
  assert.equal(captured["error_message"], null);
  assert.equal(captured["updated_at"], "2026-04-25T13:00:00.000Z");
});

test("updateNotificationAttemptResult writes failed update row", async () => {
  let captured: Record<string, unknown> | null = null;
  const out = await updateNotificationAttemptResult({
    supabase: fakeSupabase({
      data: { id: "attempt_2" },
      error: null,
      capture: (row) => {
        captured = row as Record<string, unknown>;
      },
    }),
    attemptId: "attempt_2",
    result: {
      ok: false,
      provider: "expo",
      error_code: "RATE_LIMIT",
      error_message: "Too many requests.",
      failed_at: "2026-04-25T13:05:00.000Z",
      retryable: true,
    },
  });

  assert.deepEqual(out, { updated: true, attempt_id: "attempt_2" });
  assert.ok(captured);
  assert.equal(captured["status"], "failed");
  assert.equal(captured["provider"], "expo");
  assert.equal(captured["provider_message_id"], null);
  assert.equal(captured["error_code"], "RATE_LIMIT");
  assert.equal(captured["error_message"], "Too many requests.");
  assert.equal(captured["updated_at"], "2026-04-25T13:05:00.000Z");
});

test("updateNotificationAttemptResult throws stable error on db failure", async () => {
  await assert.rejects(
    () =>
      updateNotificationAttemptResult({
        supabase: fakeSupabase({
          data: null,
          error: { code: "XX002", message: "write failed" },
        }),
        attemptId: "attempt_3",
        result: {
          ok: true,
          provider: "test",
          provider_message_id: "msg",
          sent_at: "2026-04-25T13:10:00.000Z",
        },
      }),
    /update_notification_attempt_failed:XX002/,
  );
});

test("updateNotificationAttemptResult throws stable not_found when row missing", async () => {
  await assert.rejects(
    () =>
      updateNotificationAttemptResult({
        supabase: fakeSupabase({
          data: null,
          error: null,
        }),
        attemptId: "attempt_missing",
        result: {
          ok: true,
          provider: "test",
          provider_message_id: "msg",
          sent_at: "2026-04-25T13:10:00.000Z",
        },
      }),
    /update_notification_attempt_failed:not_found/,
  );
});
