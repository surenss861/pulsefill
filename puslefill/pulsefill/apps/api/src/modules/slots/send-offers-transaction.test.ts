import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAtomicNoMatchesRpcArgs,
  buildAtomicSendOffersRpcArgs,
  parseAtomicSendOffersResult,
} from "./send-offers-transaction.js";

const ids = {
  slot: "11111111-1111-4111-8111-111111111111",
  business: "22222222-2222-4222-8222-222222222222",
  staff: "33333333-3333-4333-8333-333333333333",
  auth: "44444444-4444-4444-8444-444444444444",
};

test("buildAtomicSendOffersRpcArgs keeps all send-offers DB mutations behind one RPC contract", () => {
  const args = buildAtomicSendOffersRpcArgs({
    openSlotId: ids.slot,
    businessId: ids.business,
    staffId: ids.staff,
    authUserId: ids.auth,
    queueEnabled: true,
    matchSummary: { eligible: 2 },
    offerRows: [
      {
        customer_id: "55555555-5555-4555-8555-555555555555",
        channel: "push",
        expires_at: "2026-04-30T18:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(args, {
    p_open_slot_id: ids.slot,
    p_business_id: ids.business,
    p_staff_id: ids.staff,
    p_staff_auth_user_id: ids.auth,
    p_queue_enabled: true,
    p_match_summary: { eligible: 2 },
    p_offer_rows: [
      {
        customer_id: "55555555-5555-4555-8555-555555555555",
        channel: "push",
        expires_at: "2026-04-30T18:00:00.000Z",
      },
    ],
  });
});

test("buildAtomicNoMatchesRpcArgs records no-match audit and touch through one RPC contract", () => {
  const args = buildAtomicNoMatchesRpcArgs({
    openSlotId: ids.slot,
    businessId: ids.business,
    staffId: ids.staff,
    authUserId: ids.auth,
    noMatchesReason: "no_active_preferences",
    matchSummary: { active: 0 },
    matchDiagnostics: [{ customer_id: "c1", reason: "inactive" }],
  });

  assert.deepEqual(args, {
    p_open_slot_id: ids.slot,
    p_business_id: ids.business,
    p_staff_id: ids.staff,
    p_staff_auth_user_id: ids.auth,
    p_no_matches_reason: "no_active_preferences",
    p_match_summary: { active: 0 },
    p_match_diagnostics: [{ customer_id: "c1", reason: "inactive" }],
  });
});

test("parseAtomicSendOffersResult normalizes RPC offer rows", () => {
  const parsed = parseAtomicSendOffersResult({
    ok: true,
    offer_ids: ["offer-1"],
    offer_customer_ids: [
      { offer_id: "offer-1", customer_id: "customer-1", channel: "sms" },
      { offer_id: "", customer_id: "customer-2", channel: "push" },
    ],
  });

  assert.deepEqual(parsed, {
    ok: true,
    offer_ids: ["offer-1"],
    offer_customer_ids: [{ offer_id: "offer-1", customer_id: "customer-1", channel: "sms" }],
  });
});

test("parseAtomicSendOffersResult preserves stable RPC errors", () => {
  assert.deepEqual(parseAtomicSendOffersResult({ ok: false, error: "offers_in_flight", status: "offered" }), {
    ok: false,
    error: "offers_in_flight",
    status: "offered",
  });
});
