import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCustomerBookingConfirmedPush,
  buildCustomerLostOpportunityPush,
  buildCustomerOfferExpiringSoonPush,
  buildCustomerOfferSentPush,
  buildCustomerStandbySetupSuggestionPush,
  buildCustomerStandbyStatusReminderPush,
  buildOperatorClaimNeedsConfirmationPush,
  buildOperatorDeliveryFailurePush,
  formatPushSlotTime,
} from "./push-payloads.js";

test("formatPushSlotTime falls back to soon for invalid input", () => {
  assert.equal(formatPushSlotTime("invalid"), "soon");
});

test("buildCustomerOfferSentPush returns stable payload", () => {
  const payload = buildCustomerOfferSentPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    serviceName: "Dental cleaning",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.type, "offer_received");
  assert.equal(payload.title, "New opening available");
  assert.equal(payload.deep_link, "/customer/offers/offer_1");
  assert.equal(payload.dedupe_key, "offer_received:offer_1");
  assert.equal(payload.created_at, "2026-04-25T12:00:00.000Z");
  assert.equal(payload.business_id, "business_1");
  assert.equal(payload.customer_id, "customer_1");
  assert.equal(payload.open_slot_id, "slot_1");
  assert.equal(payload.data.type, "offer_received");
  assert.equal(payload.data.offer_id, "offer_1");
  assert.match(payload.body, /Dental cleaning/);
});

test("buildCustomerBookingConfirmedPush returns stable payload", () => {
  const payload = buildCustomerBookingConfirmedPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    claimId: "claim_1",
    serviceName: "Consultation",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.type, "booking_confirmed");
  assert.equal(payload.title, "Booking confirmed");
  assert.equal(payload.deep_link, "/customer/claims/claim_1");
  assert.equal(payload.dedupe_key, "booking_confirmed:claim_1");
  assert.equal(payload.claim_id, "claim_1");
  assert.equal(payload.actor, "operator");
  assert.equal(payload.data.claim_id, "claim_1");
  assert.match(payload.body, /Consultation/);
});

test("buildOperatorClaimNeedsConfirmationPush returns stable payload", () => {
  const payload = buildOperatorClaimNeedsConfirmationPush({
    businessId: "business_1",
    openSlotId: "slot_1",
    claimId: "claim_1",
    customerId: "customer_1",
    serviceName: "Root canal",
    startsAt: "2026-04-25T18:00:00.000Z",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.type, "operator_claim_needs_confirmation");
  assert.equal(payload.title, "Claim needs confirmation");
  assert.equal(payload.deep_link, "/open-slots/slot_1?from=push");
  assert.equal(payload.dedupe_key, "operator_claim_needs_confirmation:claim_1");
  assert.equal(payload.claim_id, "claim_1");
  assert.equal(payload.data.customer_id, "customer_1");
});

test("buildCustomerLostOpportunityPush uses claim link and dedupe when claim exists", () => {
  const payload = buildCustomerLostOpportunityPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    claimId: "claim_1",
    serviceName: "Dental cleaning",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.type, "claim_unavailable");
  assert.equal(payload.deep_link, "/customer/claims/claim_1");
  assert.equal(payload.dedupe_key, "claim_unavailable:claim_1");
  assert.equal(payload.data.claim_id, "claim_1");
});

test("buildCustomerLostOpportunityPush falls back when claim is missing", () => {
  const payload = buildCustomerLostOpportunityPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    claimId: null,
    serviceName: null,
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.deep_link, "/customer/standby");
  assert.equal(payload.type, "missed_opportunity");
  assert.equal(payload.dedupe_key, "missed_opportunity:slot_1:customer_1");
  assert.equal(payload.claim_id, undefined);
  assert.match(payload.body, /That opening/);
});

test("buildCustomerStandbySetupSuggestionPush uses day-based dedupe", () => {
  const payload = buildCustomerStandbySetupSuggestionPush({
    businessId: "business_1",
    customerId: "customer_1",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.type, "standby_setup_suggestion");
  assert.equal(payload.deep_link, "/customer/standby");
  assert.equal(payload.dedupe_key, "standby_setup_suggestion:business_1:customer_1:2026-04-25");
});

test("buildCustomerStandbyStatusReminderPush uses day-based dedupe", () => {
  const payload = buildCustomerStandbyStatusReminderPush({
    businessId: "business_1",
    customerId: "customer_1",
    createdAt: "2026-04-25T23:59:59.000Z",
  });

  assert.equal(payload.type, "standby_status_reminder");
  assert.equal(payload.deep_link, "/customer/standby");
  assert.equal(payload.dedupe_key, "standby_status_reminder:business_1:customer_1:2026-04-25");
});

test("buildCustomerOfferExpiringSoonPush includes optional claim id", () => {
  const payload = buildCustomerOfferExpiringSoonPush({
    businessId: "business_1",
    customerId: "customer_1",
    openSlotId: "slot_1",
    offerId: "offer_1",
    claimId: "claim_1",
    serviceName: "Cleaning",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.type, "offer_expiring_soon");
  assert.equal(payload.deep_link, "/customer/offers/offer_1");
  assert.equal(payload.dedupe_key, "offer_expiring_soon:offer_1");
  assert.equal(payload.claim_id, "claim_1");
  assert.equal(payload.data.claim_id, "claim_1");
});

test("buildOperatorDeliveryFailurePush returns stable payload", () => {
  const payload = buildOperatorDeliveryFailurePush({
    businessId: "business_1",
    openSlotId: "slot_1",
    serviceName: "Cleaning",
    createdAt: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(payload.type, "operator_delivery_failure");
  assert.equal(payload.title, "Delivery issue detected");
  assert.equal(payload.deep_link, "/open-slots/slot_1?from=push");
  assert.equal(payload.dedupe_key, "operator_delivery_failure:slot_1:2026-04-25");
  assert.equal(payload.data.open_slot_id, "slot_1");
});
