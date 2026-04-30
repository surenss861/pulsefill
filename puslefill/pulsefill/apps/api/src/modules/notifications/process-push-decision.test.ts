import assert from "node:assert/strict";
import test from "node:test";

import { decideCustomerOfferSentPush } from "./push-decision.js";
import { processPushDecision } from "./process-push-decision.js";
import { createTestPushProvider } from "./test-push-provider.js";

function makeDecision(overrides?: {
  pushPermission?: "granted" | "denied";
  dedupeAlreadySent?: boolean;
}) {
  return decideCustomerOfferSentPush({
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
        push_permission: overrides?.pushPermission ?? "granted",
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
      dedupeAlreadySent: overrides?.dedupeAlreadySent ?? false,
    },
  });
}

function fakeSupabase(input?: {
  duplicateOnInsert?: boolean;
  insertErrorCode?: string;
}) {
  const state: {
    insertCalls: number;
    updateCalls: number;
    insertedRow?: Record<string, unknown>;
    updatedRow?: Record<string, unknown>;
    updatedId?: string;
  } = { insertCalls: 0, updateCalls: 0 };

  const client = {
    from: (table: string) => {
      assert.equal(table, "notification_delivery_attempts");
      return {
        insert: (row: unknown) => {
          state.insertCalls += 1;
          state.insertedRow = row as Record<string, unknown>;
          return {
            select: (_fields: string) => ({
              single: async () => {
                if (input?.duplicateOnInsert) {
                  return {
                    data: null,
                    error: { code: "23505", message: "duplicate key value violates unique constraint" },
                  };
                }
                if (input?.insertErrorCode) {
                  return { data: null, error: { code: input.insertErrorCode, message: "insert failed" } };
                }
                return { data: { id: "attempt_1", dedupe_key: "offer_received:offer_1" }, error: null };
              },
            }),
          };
        },
        update: (row: unknown) => {
          state.updateCalls += 1;
          state.updatedRow = row as Record<string, unknown>;
          return {
            eq: (field: string, value: string) => {
              assert.equal(field, "id");
              state.updatedId = value;
              return {
                select: (_fields: string) => ({
                  maybeSingle: async () => ({ data: { id: value }, error: null }),
                }),
              };
            },
          };
        },
      };
    },
  };

  return { client, state };
}

test("processPushDecision handles send success end-to-end", async () => {
  const decision = makeDecision();
  const { client, state } = fakeSupabase();
  let providerCalls = 0;
  const provider = {
    async send(args: { dedupe_key: string }) {
      providerCalls += 1;
      assert.equal(args.dedupe_key, "offer_received:offer_1");
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "test-msg-1",
        sent_at: "2026-04-25T15:00:00.000Z",
      };
    },
  };

  const out = await processPushDecision({
    supabase: client,
    decision,
    provider,
  });

  assert.equal(out.status, "sent");
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 1);
  assert.equal(providerCalls, 1);
  assert.equal(state.insertedRow?.status, "queued");
  assert.equal(state.updatedRow?.status, "sent");
  assert.equal(state.updatedRow?.provider_message_id, "test-msg-1");
});

test("processPushDecision handles send failure end-to-end", async () => {
  const decision = makeDecision();
  const { client, state } = fakeSupabase();
  const provider = createTestPushProvider({
    mode: "failure",
    errorCode: "TEST_DOWN",
    errorMessage: "Simulated provider outage",
    nowIso: "2026-04-25T15:05:00.000Z",
  });

  const out = await processPushDecision({
    supabase: client,
    decision,
    provider,
  });

  assert.equal(out.status, "failed");
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 1);
  assert.equal(state.updatedRow?.status, "failed");
  assert.equal(state.updatedRow?.error_code, "TEST_DOWN");
  assert.equal(state.updatedRow?.error_message, "Simulated provider outage");
});

test("processPushDecision records suppressed and does not call provider", async () => {
  const decision = makeDecision({ pushPermission: "denied" });
  const { client, state } = fakeSupabase();
  let providerCalls = 0;
  const provider = {
    async send() {
      providerCalls += 1;
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "x",
        sent_at: "2026-04-25T15:00:00.000Z",
      };
    },
  };

  const out = await processPushDecision({
    supabase: client,
    decision,
    provider,
  });

  assert.equal(out.status, "suppressed");
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 0);
  assert.equal(providerCalls, 0);
  assert.equal(state.insertedRow?.status, "suppressed");
});

test("processPushDecision skips duplicate attempts and does not call provider", async () => {
  const decision = makeDecision();
  const { client, state } = fakeSupabase({ duplicateOnInsert: true });
  let providerCalls = 0;
  const provider = {
    async send() {
      providerCalls += 1;
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "x",
        sent_at: "2026-04-25T15:00:00.000Z",
      };
    },
  };

  const out = await processPushDecision({
    supabase: client,
    decision,
    provider,
  });

  assert.equal(out.status, "skipped");
  assert.equal(out.recorded, false);
  assert.equal(out.skipped_reason, "duplicate");
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 0);
  assert.equal(providerCalls, 0);
});
