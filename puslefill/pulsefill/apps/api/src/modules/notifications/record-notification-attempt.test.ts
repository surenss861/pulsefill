import assert from "node:assert/strict";
import test from "node:test";

import { decideCustomerOfferSentPush } from "./push-decision.js";
import { recordNotificationAttempt, type SupabaseClientLike } from "./record-notification-attempt.js";

const baseDecision = decideCustomerOfferSentPush({
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
      push_permission: "granted",
    },
    device: {
      token: "device_token_1",
      platform: "ios",
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
});

function fakeSupabase(result: {
  data: { id: string; dedupe_key: string } | null;
  error: { code?: string; message?: string } | null;
  capture?: (row: unknown) => void;
}): SupabaseClientLike {
  return {
    from: (table: string) => {
      assert.equal(table, "notification_delivery_attempts");
      return {
        insert: (row: unknown) => {
          result.capture?.(row);
          return {
            select: (fields: string) => {
              assert.equal(fields, "id,dedupe_key");
              return {
                single: async () => ({ data: result.data, error: result.error }),
              };
            },
          };
        },
      };
    },
  };
}

test("recordNotificationAttempt inserts queued send attempt", async () => {
  let captured: Record<string, unknown> | null = null;
  const out = await recordNotificationAttempt({
    supabase: fakeSupabase({
      data: { id: "attempt_1", dedupe_key: "customer_offer_sent:offer_1" },
      error: null,
      capture: (row) => {
        captured = row as Record<string, unknown>;
      },
    }),
    decision: baseDecision,
  });

  assert.deepEqual(out, {
    recorded: true,
    attempt_id: "attempt_1",
    dedupe_key: "customer_offer_sent:offer_1",
  });
  assert.ok(captured);
  assert.equal(captured["decision"], "send");
  assert.equal(captured["status"], "queued");
});

test("recordNotificationAttempt inserts suppressed attempt", async () => {
  const suppressed = decideCustomerOfferSentPush({
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
        push_permission: "denied",
      },
      device: {
        token: "device_token_1",
        platform: "ios",
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
  });

  let captured: Record<string, unknown> | null = null;
  const out = await recordNotificationAttempt({
    supabase: fakeSupabase({
      data: { id: "attempt_2", dedupe_key: "customer_offer_sent:offer_1" },
      error: null,
      capture: (row) => {
        captured = row as Record<string, unknown>;
      },
    }),
    decision: suppressed,
  });

  assert.equal(out.recorded, true);
  assert.ok(captured);
  assert.equal(captured["decision"], "suppress");
  assert.equal(captured["status"], "suppressed");
  assert.equal(captured["suppression_reason"], "push_permission_denied");
});

test("recordNotificationAttempt skips safely for missing payload", async () => {
  const out = await recordNotificationAttempt({
    supabase: fakeSupabase({
      data: null,
      error: null,
    }),
    decision: { ok: false, reason: "dedupe_already_sent", retryable: false },
  });

  assert.deepEqual(out, {
    recorded: false,
    skipped_reason: "missing_payload",
  });
});

test("recordNotificationAttempt returns duplicate skip on dedupe conflict", async () => {
  const out = await recordNotificationAttempt({
    supabase: fakeSupabase({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    }),
    decision: baseDecision,
  });

  assert.deepEqual(out, {
    recorded: false,
    skipped_reason: "duplicate",
    dedupe_key: "customer_offer_sent:offer_1",
  });
});

test("recordNotificationAttempt throws stable failure on non-duplicate insert error", async () => {
  await assert.rejects(
    () =>
      recordNotificationAttempt({
        supabase: fakeSupabase({
          data: null,
          error: { code: "XX001", message: "random failure" },
        }),
        decision: baseDecision,
      }),
    /record_notification_attempt_failed:XX001/,
  );
});
