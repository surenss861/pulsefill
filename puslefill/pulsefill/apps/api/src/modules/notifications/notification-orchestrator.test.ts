import assert from "node:assert/strict";
import test from "node:test";

import {
  queueCustomerBookingConfirmedNotification,
  queueCustomerOfferSentNotification,
  queueCustomerStandbySetupSuggestionNotification,
  queueOperatorClaimNeedsConfirmationNotification,
} from "./notification-orchestrator.js";
import { createTestPushProvider } from "./test-push-provider.js";

function baseContext() {
  return {
    nowIso: "2026-04-25T14:00:00.000",
    businessId: "11111111-1111-4111-8111-111111111111",
    recipient: {
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
    dedupeAlreadySent: false,
  };
}

function fakeSupabase(input?: { duplicateOnInsert?: boolean }) {
  const state: {
    insertCalls: number;
    updateCalls: number;
    insertedRow?: Record<string, unknown>;
    updatedRow?: Record<string, unknown>;
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
                return {
                  data: { id: "attempt_1", dedupe_key: (state.insertedRow?.dedupe_key as string) ?? "x" },
                  error: null,
                };
              },
            }),
          };
        },
        update: (row: unknown) => {
          state.updateCalls += 1;
          state.updatedRow = row as Record<string, unknown>;
          return {
            eq: (_field: string, id: string) => ({
              select: (_fields: string) => ({
                maybeSingle: async () => ({ data: { id }, error: null }),
              }),
            }),
          };
        },
      };
    },
  };

  return { client, state };
}

test("queueCustomerOfferSentNotification eligible flow inserts queued and updates sent", async () => {
  const { client, state } = fakeSupabase();
  let providerCalls = 0;
  const provider = {
    async send(args: { payload: { deep_link: string }; dedupe_key: string }) {
      providerCalls += 1;
      assert.equal(args.payload.deep_link, "/customer/offers/offer_1");
      assert.equal(args.dedupe_key, "offer_received:offer_1");
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "msg_1",
        sent_at: "2026-04-25T14:01:00.000Z",
      };
    },
  };

  const out = await queueCustomerOfferSentNotification({
    ...baseContext(),
    supabase: client,
    provider,
    offer: { id: "offer_1", open_slot_id: "33333333-3333-4333-8333-333333333333" },
    slot: { service_name: "Dental cleaning", starts_at: "2026-04-25T18:00:00.000Z" },
  });

  assert.equal(out.status, "sent");
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 1);
  assert.equal(providerCalls, 1);
  assert.equal(state.insertedRow?.decision, "send");
  assert.equal(state.insertedRow?.status, "queued");
  assert.equal(state.insertedRow?.dedupe_key, "offer_received:offer_1");
  const payload = state.insertedRow?.payload as { deep_link: string };
  assert.equal(payload.deep_link, "/customer/offers/offer_1");
});

test("queueCustomerOfferSentNotification suppressed flow records suppressed and skips provider", async () => {
  const { client, state } = fakeSupabase();
  let providerCalls = 0;
  const provider = {
    async send() {
      providerCalls += 1;
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "msg_1",
        sent_at: "2026-04-25T14:01:00.000Z",
      };
    },
  };

  const out = await queueCustomerOfferSentNotification({
    ...baseContext(),
    recipient: { ...baseContext().recipient, push_permission: "denied" },
    supabase: client,
    provider,
    offer: { id: "offer_1", open_slot_id: "33333333-3333-4333-8333-333333333333" },
    slot: { service_name: "Dental cleaning", starts_at: "2026-04-25T18:00:00.000Z" },
  });

  assert.equal(out.status, "suppressed");
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 0);
  assert.equal(providerCalls, 0);
  assert.equal(state.insertedRow?.decision, "suppress");
  assert.equal(state.insertedRow?.status, "suppressed");
  assert.equal(state.insertedRow?.suppression_reason, "push_permission_denied");
  assert.equal(state.insertedRow?.dedupe_key, "offer_received:offer_1");
});

test("queueCustomerOfferSentNotification duplicate skips provider and update", async () => {
  const { client, state } = fakeSupabase({ duplicateOnInsert: true });
  let providerCalls = 0;
  const provider = {
    async send() {
      providerCalls += 1;
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "msg_1",
        sent_at: "2026-04-25T14:01:00.000Z",
      };
    },
  };

  const out = await queueCustomerOfferSentNotification({
    ...baseContext(),
    supabase: client,
    provider,
    offer: { id: "offer_1", open_slot_id: "33333333-3333-4333-8333-333333333333" },
    slot: { service_name: "Dental cleaning", starts_at: "2026-04-25T18:00:00.000Z" },
  });

  assert.equal(out.status, "skipped");
  if (out.status === "skipped") {
    assert.equal(out.skipped_reason, "duplicate");
  }
  assert.equal(providerCalls, 0);
  assert.equal(state.updateCalls, 0);
});

test("queueOperatorClaimNeedsConfirmationNotification uses operator deep link and dedupe", async () => {
  const { client, state } = fakeSupabase();
  const provider = createTestPushProvider({ mode: "success", messageId: "op-msg-1", nowIso: "2026-04-25T14:02:00.000Z" });

  const out = await queueOperatorClaimNeedsConfirmationNotification({
    ...baseContext(),
    supabase: client,
    provider,
    claim: {
      id: "claim_1",
      customer_id: "44444444-4444-4444-8444-444444444444",
      open_slot_id: "33333333-3333-4333-8333-333333333333",
    },
    slot: { service_name: "Dental cleaning", starts_at: "2026-04-25T18:00:00.000Z" },
  });

  assert.equal(out.status, "sent");
  assert.equal(state.insertedRow?.dedupe_key, "operator_claim_needs_confirmation:claim_1");
  const payload = state.insertedRow?.payload as { deep_link: string };
  assert.equal(payload.deep_link, "/open-slots/33333333-3333-4333-8333-333333333333?from=push");
});

test("queueCustomerBookingConfirmedNotification uses claim deep link and dedupe", async () => {
  const { client, state } = fakeSupabase();
  const provider = createTestPushProvider({ mode: "success", messageId: "booking-msg-1", nowIso: "2026-04-25T14:03:00.000Z" });

  const out = await queueCustomerBookingConfirmedNotification({
    ...baseContext(),
    supabase: client,
    provider,
    claim: { id: "claim_1", open_slot_id: "33333333-3333-4333-8333-333333333333" },
    slot: { service_name: "Dental cleaning", starts_at: "2026-04-25T18:00:00.000Z" },
  });

  assert.equal(out.status, "sent");
  assert.equal(state.insertedRow?.dedupe_key, "booking_confirmed:claim_1");
  const payload = state.insertedRow?.payload as { deep_link: string };
  assert.equal(payload.deep_link, "/customer/claims/claim_1");
});

test("queueCustomerStandbySetupSuggestionNotification suppressed by quiet hours", async () => {
  const { client, state } = fakeSupabase();
  let providerCalls = 0;
  const provider = {
    async send() {
      providerCalls += 1;
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "msg_1",
        sent_at: "2026-04-25T14:01:00.000Z",
      };
    },
  };

  const out = await queueCustomerStandbySetupSuggestionNotification({
    ...baseContext(),
    supabase: client,
    provider,
    notificationPrefs: {
      push_enabled: true,
      disabled_types: [],
      quiet_hours_enabled: true,
      quiet_hours_start: "13:00",
      quiet_hours_end: "15:00",
    },
  });

  assert.equal(out.status, "suppressed");
  if (out.status === "suppressed") {
    assert.equal(out.reason, "quiet_hours");
  }
  assert.equal(state.insertedRow?.decision, "suppress");
  assert.equal(state.insertedRow?.status, "suppressed");
  assert.equal(providerCalls, 0);
});
