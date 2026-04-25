import assert from "node:assert/strict";
import test from "node:test";

import {
  loadCustomerBookingConfirmedNotificationContext,
  loadCustomerOfferSentNotificationContext,
  loadOperatorClaimNeedsConfirmationNotificationContext,
} from "./notification-context-loaders.js";

const BUSINESS_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const OFFER_ID = "33333333-3333-4333-8333-333333333333";
const CLAIM_ID = "44444444-4444-4444-8444-444444444444";
const SLOT_ID = "55555555-5555-4555-8555-555555555555";
const SERVICE_ID = "66666666-6666-4666-8666-666666666666";

function fakeSupabase(seed: {
  customers?: Record<string, Record<string, unknown>>;
  offers?: Record<string, Record<string, unknown>>;
  claims?: Record<string, Record<string, unknown>>;
  slots?: Record<string, Record<string, unknown>>;
  services?: Record<string, Record<string, unknown>>;
  prefs?: Record<string, Record<string, unknown>>;
  errors?: Partial<Record<"customers" | "slot_offers" | "slot_claims" | "open_slots" | "services" | "customer_notification_preferences", { code: string }>>;
}) {
  const tables: Record<string, Record<string, Record<string, unknown>> | undefined> = {
    customers: seed.customers,
    slot_offers: seed.offers,
    slot_claims: seed.claims,
    open_slots: seed.slots,
    services: seed.services,
    customer_notification_preferences: seed.prefs,
  };

  return {
    from: (table: string) => ({
      select: (_fields: string) => {
        const filters: Array<{ field: string; value: string | boolean }> = [];
        return {
          eq(field: string, value: string | boolean) {
            filters.push({ field, value });
            return this;
          },
          async maybeSingle() {
            const err = seed.errors?.[table as keyof typeof seed.errors];
            if (err) return { data: null, error: err };
            const map = tables[table];
            if (!map) return { data: null, error: null };
            const rows = Object.values(map);
            const matched = rows.find((r) =>
              filters.every((f) => String((r as Record<string, unknown>)[f.field]) === String(f.value)),
            );
            return { data: matched ?? null, error: null };
          },
        };
      },
    }),
  };
}

test("offer sent context loads customer/prefs/device/offer/slot", async () => {
  const supabase = fakeSupabase({
    customers: { [CUSTOMER_ID]: { id: CUSTOMER_ID } },
    offers: { [OFFER_ID]: { id: OFFER_ID, customer_id: CUSTOMER_ID, open_slot_id: SLOT_ID } },
    slots: { [SLOT_ID]: { id: SLOT_ID, business_id: BUSINESS_ID, starts_at: "2026-04-25T18:00:00.000Z", service_id: SERVICE_ID } },
    services: { [SERVICE_ID]: { id: SERVICE_ID, name: "Dental cleaning" } },
    prefs: {
      [CUSTOMER_ID]: {
        customer_id: CUSTOMER_ID,
        quiet_hours_enabled: true,
        quiet_hours_start_local: "22:00:00",
        quiet_hours_end_local: "08:00:00",
        notify_new_offers: true,
      },
    },
  });

  const out = await loadCustomerOfferSentNotificationContext(
    {
      supabase,
      businessId: BUSINESS_ID,
      offerId: OFFER_ID,
      customerId: CUSTOMER_ID,
    },
    {
      getActivePushDevice: async () => ({
        token: "token_1",
        platform: "ios",
        token_type: "apns",
        active: true,
      }),
    },
  );

  assert.equal(out.ok, true);
  if (!out.ok) return;
  assert.equal(out.context.recipient.id, CUSTOMER_ID);
  assert.equal(out.context.offer.id, OFFER_ID);
  assert.equal(out.context.slot.service_name, "Dental cleaning");
  assert.equal(out.context.notificationPrefs.quiet_hours_start, "22:00");
  assert.equal(out.context.device?.token, "token_1");
});

test("offer sent context returns missing_offer when absent", async () => {
  const supabase = fakeSupabase({
    customers: { [CUSTOMER_ID]: { id: CUSTOMER_ID } },
  });
  const out = await loadCustomerOfferSentNotificationContext({
    supabase,
    businessId: BUSINESS_ID,
    offerId: OFFER_ID,
    customerId: CUSTOMER_ID,
  });
  assert.deepEqual(out, { ok: false, reason: "missing_offer", retryable: false });
});

test("offer sent context returns missing_customer when absent", async () => {
  const supabase = fakeSupabase({});
  const out = await loadCustomerOfferSentNotificationContext({
    supabase,
    businessId: BUSINESS_ID,
    offerId: OFFER_ID,
    customerId: CUSTOMER_ID,
  });
  assert.deepEqual(out, { ok: false, reason: "missing_customer", retryable: false });
});

test("offer sent context returns missing_slot when absent", async () => {
  const supabase = fakeSupabase({
    customers: { [CUSTOMER_ID]: { id: CUSTOMER_ID } },
    offers: { [OFFER_ID]: { id: OFFER_ID, customer_id: CUSTOMER_ID, open_slot_id: SLOT_ID } },
  });
  const out = await loadCustomerOfferSentNotificationContext({
    supabase,
    businessId: BUSINESS_ID,
    offerId: OFFER_ID,
    customerId: CUSTOMER_ID,
  });
  assert.deepEqual(out, { ok: false, reason: "missing_slot", retryable: false });
});

test("offer sent context returns lookup_failed when device lookup throws", async () => {
  const supabase = fakeSupabase({
    customers: { [CUSTOMER_ID]: { id: CUSTOMER_ID } },
    offers: { [OFFER_ID]: { id: OFFER_ID, customer_id: CUSTOMER_ID, open_slot_id: SLOT_ID } },
    slots: { [SLOT_ID]: { id: SLOT_ID, business_id: BUSINESS_ID, starts_at: "2026-04-25T18:00:00.000Z", service_id: null } },
  });
  const out = await loadCustomerOfferSentNotificationContext(
    {
      supabase,
      businessId: BUSINESS_ID,
      offerId: OFFER_ID,
      customerId: CUSTOMER_ID,
    },
    {
      getActivePushDevice: async () => {
        throw new Error("boom");
      },
    },
  );
  assert.deepEqual(out, { ok: false, reason: "lookup_failed", retryable: true });
});

test("booking confirmed context loads claim/slot/customer/device", async () => {
  const supabase = fakeSupabase({
    claims: { [CLAIM_ID]: { id: CLAIM_ID, customer_id: CUSTOMER_ID, open_slot_id: SLOT_ID } },
    customers: { [CUSTOMER_ID]: { id: CUSTOMER_ID } },
    slots: { [SLOT_ID]: { id: SLOT_ID, business_id: BUSINESS_ID, starts_at: "2026-04-25T18:00:00.000Z", service_id: SERVICE_ID } },
    services: { [SERVICE_ID]: { id: SERVICE_ID, name: "Consultation" } },
    prefs: {
      [CUSTOMER_ID]: {
        customer_id: CUSTOMER_ID,
        quiet_hours_enabled: false,
        notify_booking_confirmations: true,
      },
    },
  });
  const out = await loadCustomerBookingConfirmedNotificationContext(
    {
      supabase,
      businessId: BUSINESS_ID,
      claimId: CLAIM_ID,
    },
    {
      getActivePushDevice: async () => ({
        token: "token_2",
        platform: "ios",
        token_type: "expo",
        active: true,
      }),
    },
  );
  assert.equal(out.ok, true);
  if (!out.ok) return;
  assert.equal(out.context.claim.id, CLAIM_ID);
  assert.equal(out.context.slot.service_name, "Consultation");
  assert.equal(out.context.device?.token_type, "expo");
});

test("operator claim confirmation context is unsupported without staff device model", async () => {
  const out = await loadOperatorClaimNeedsConfirmationNotificationContext();
  assert.deepEqual(out, { ok: false, reason: "unsupported_recipient", retryable: false });
});
