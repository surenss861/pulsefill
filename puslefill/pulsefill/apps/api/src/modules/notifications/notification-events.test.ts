import assert from "node:assert/strict";
import test from "node:test";

import {
  handleCustomerBookingConfirmedNotificationEvent,
  handleCustomerOfferSentNotificationEvent,
} from "./notification-events.js";
import { createTestPushProvider } from "./test-push-provider.js";

const BUSINESS_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const OFFER_ID = "33333333-3333-4333-8333-333333333333";
const CLAIM_ID = "44444444-4444-4444-8444-444444444444";
const SLOT_ID = "55555555-5555-4555-8555-555555555555";
const SERVICE_ID = "66666666-6666-4666-8666-666666666666";

function fakeSupabase(seed?: {
  pushPermissionDenied?: boolean;
  duplicateAttempt?: boolean;
  missingOffer?: boolean;
  missingClaim?: boolean;
}) {
  const state: {
    providerCalls: number;
    insertCalls: number;
    updateCalls: number;
    inserted?: Record<string, unknown>;
    updated?: Record<string, unknown>;
  } = { providerCalls: 0, insertCalls: 0, updateCalls: 0 };

  const db = {
    customers: [{ id: CUSTOMER_ID }],
    slot_offers: seed?.missingOffer ? [] : [{ id: OFFER_ID, customer_id: CUSTOMER_ID, open_slot_id: SLOT_ID }],
    slot_claims: seed?.missingClaim ? [] : [{ id: CLAIM_ID, customer_id: CUSTOMER_ID, open_slot_id: SLOT_ID }],
    open_slots: [{ id: SLOT_ID, business_id: BUSINESS_ID, starts_at: "2026-04-25T18:00:00.000Z", service_id: SERVICE_ID }],
    services: [{ id: SERVICE_ID, name: "Dental cleaning" }],
    customer_notification_preferences: [
      {
        customer_id: CUSTOMER_ID,
        quiet_hours_enabled: false,
        quiet_hours_start_local: null,
        quiet_hours_end_local: null,
        notify_new_offers: true,
        notify_booking_confirmations: true,
      },
    ],
    customer_push_devices: [
      {
        customer_id: CUSTOMER_ID,
        device_token: "token_1",
        platform: "ios",
        token_type: "apns",
        active: true,
        last_seen_at: "2026-04-25T15:00:00.000Z",
        updated_at: "2026-04-25T14:00:00.000Z",
        created_at: "2026-04-24T14:00:00.000Z",
      },
    ],
  };

  if (seed?.pushPermissionDenied) {
    (db.customers as any)[0].push_permission = "denied";
  }

  const client = {
    from: (table: string) => {
      const rows = (db as Record<string, Array<Record<string, unknown>>>)[table] ?? [];
      const filters: Array<{ field: string; value: string | boolean }> = [];
      return {
        select: (_fields: string) => ({
          eq(field: string, value: string | boolean) {
            filters.push({ field, value });
            return this;
          },
          order() {
            return this;
          },
          async limit() {
            let out = [...rows];
            for (const f of filters) out = out.filter((r) => String(r[f.field]) === String(f.value));
            return { data: out, error: null };
          },
          async maybeSingle() {
            let out = [...rows];
            for (const f of filters) out = out.filter((r) => String(r[f.field]) === String(f.value));
            return { data: out[0] ?? null, error: null };
          },
        }),
        insert: (row: unknown) => {
          state.insertCalls += 1;
          state.inserted = row as Record<string, unknown>;
          return {
            select: (_fields: string) => ({
              async single() {
                if (seed?.duplicateAttempt) {
                  return { data: null, error: { code: "23505", message: "duplicate key" } };
                }
                return {
                  data: { id: "attempt_1", dedupe_key: String((state.inserted ?? {}).dedupe_key ?? "") },
                  error: null,
                };
              },
            }),
          };
        },
        update: (row: unknown) => {
          state.updateCalls += 1;
          state.updated = row as Record<string, unknown>;
          return {
            eq: (_field: string, id: string) => ({
              select: (_fields: string) => ({
                async maybeSingle() {
                  return { data: { id }, error: null };
                },
              }),
            }),
          };
        },
      };
    },
  };

  const provider = {
    async send() {
      state.providerCalls += 1;
      return {
        ok: true as const,
        provider: "test" as const,
        provider_message_id: "msg_1",
        sent_at: "2026-04-25T16:00:00.000Z",
      };
    },
  };

  return { client, state, provider };
}

test("offer sent event loads context and processes notification", async () => {
  const { client, state, provider } = fakeSupabase();
  const out = await handleCustomerOfferSentNotificationEvent({
    supabase: client as any,
    provider,
    nowIso: "2026-04-25T16:00:00.000Z",
    businessId: BUSINESS_ID,
    offerId: OFFER_ID,
    customerId: CUSTOMER_ID,
  });
  assert.equal(out.ok, true);
  if (!out.ok || out.outcome !== "processed") return;
  assert.equal(state.providerCalls, 1);
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 1);
});

test("offer sent event skips when context missing", async () => {
  const { client, state, provider } = fakeSupabase({ missingOffer: true });
  const out = await handleCustomerOfferSentNotificationEvent({
    supabase: client as any,
    provider,
    nowIso: "2026-04-25T16:00:00.000Z",
    businessId: BUSINESS_ID,
    offerId: OFFER_ID,
    customerId: CUSTOMER_ID,
  });
  assert.deepEqual(out, { ok: true, outcome: "skipped", reason: "missing_offer", retryable: false });
  assert.equal(state.providerCalls, 0);
});

test("booking confirmed event processes when context exists", async () => {
  const { client, state, provider } = fakeSupabase();
  const out = await handleCustomerBookingConfirmedNotificationEvent({
    supabase: client as any,
    provider,
    nowIso: "2026-04-25T16:00:00.000Z",
    businessId: BUSINESS_ID,
    claimId: CLAIM_ID,
  });
  assert.equal(out.ok, true);
  if (!out.ok || out.outcome !== "processed") return;
  assert.equal(state.providerCalls, 1);
  assert.equal(String(state.inserted?.dedupe_key), "customer_booking_confirmed:44444444-4444-4444-8444-444444444444");
});

test("booking confirmed event skips when claim missing", async () => {
  const { client, state, provider } = fakeSupabase({ missingClaim: true });
  const out = await handleCustomerBookingConfirmedNotificationEvent({
    supabase: client as any,
    provider,
    nowIso: "2026-04-25T16:00:00.000Z",
    businessId: BUSINESS_ID,
    claimId: CLAIM_ID,
  });
  assert.deepEqual(out, { ok: true, outcome: "skipped", reason: "missing_claim", retryable: false });
  assert.equal(state.providerCalls, 0);
});

test("suppressed eligibility records suppression and skips provider", async () => {
  const { client, state } = fakeSupabase();
  const out = await handleCustomerOfferSentNotificationEvent(
    {
      supabase: client as any,
      provider: createTestPushProvider(),
      nowIso: "2026-04-25T16:00:00.000Z",
      businessId: BUSINESS_ID,
      offerId: OFFER_ID,
      customerId: CUSTOMER_ID,
    },
    {
      loadCustomerOfferSentContext: async () => ({
        ok: true as const,
        context: {
          businessId: BUSINESS_ID,
          recipient: { id: CUSTOMER_ID, push_enabled: true, push_permission: "denied" as const },
          device: { token: "token_1", platform: "ios" as const, token_type: "apns" as const, active: true as const },
          notificationPrefs: { push_enabled: true, disabled_types: [], quiet_hours_enabled: false },
          offer: { id: OFFER_ID, open_slot_id: SLOT_ID },
          slot: { service_name: "Dental cleaning", starts_at: "2026-04-25T18:00:00.000Z" },
        },
      }),
    },
  );

  assert.equal(out.ok, true);
  if (!out.ok || out.outcome !== "processed") return;
  assert.equal(out.result.status, "suppressed");
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 0);
});
