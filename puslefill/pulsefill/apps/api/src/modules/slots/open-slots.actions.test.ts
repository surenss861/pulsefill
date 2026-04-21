import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { setLoadSlotRuleContextTestDelegate } from "./load-slot-rule-context.js";
import {
  resetOpenSlotsRouteMutationTestDelegates,
  setConfirmOpenSlotMutationTestDelegate,
  setSendOffersMutationTestDelegate,
} from "./open-slots-route-test-seams.js";
import { toSlotRuleSignals } from "./operator-slot-rules.js";

const SLOT_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OFFER_ID_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OFFER_ID_B = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const FIXED_NOW_MS = Date.parse("2026-04-16T12:00:00.000Z");

function businessId() {
  return process.env.PULSEFILL_TEST_BUSINESS_ID ?? "22222222-2222-4222-8222-222222222222";
}

function claimedSlotNoConfirmSignals() {
  return toSlotRuleSignals({
    slotStatus: "claimed",
    createdAt: "2026-04-10T10:00:00.000Z",
    nowMs: FIXED_NOW_MS,
    offers: [],
    claims: [{ status: "lost" }],
    lastOfferBatchAt: null,
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
    resolutionStatus: "none",
  });
}

function claimedAwaitingConfirmationSignals() {
  return toSlotRuleSignals({
    slotStatus: "claimed",
    createdAt: "2026-04-10T10:00:00.000Z",
    nowMs: FIXED_NOW_MS,
    offers: [],
    claims: [{ status: "won" }],
    lastOfferBatchAt: null,
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
    resolutionStatus: "none",
  });
}

function openUntouchedSignals() {
  return toSlotRuleSignals({
    slotStatus: "open",
    createdAt: "2026-04-10T10:00:00.000Z",
    nowMs: FIXED_NOW_MS,
    offers: [],
    claims: [],
    lastOfferBatchAt: null,
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
    resolutionStatus: "none",
  });
}

/** Open slot with prior batch, no live offers — retry-through-send allowed. */
function openRetryableSignals() {
  return toSlotRuleSignals({
    slotStatus: "open",
    createdAt: "2026-04-10T10:00:00.000Z",
    nowMs: FIXED_NOW_MS,
    offers: [{ status: "failed", expires_at: "2026-04-16T10:00:00.000Z" }],
    claims: [],
    lastOfferBatchAt: "2026-04-16T09:00:00.000Z",
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
    resolutionStatus: "none",
  });
}

/** `offered_active`: live offers in flight — both send and retry must be disallowed at HTTP guard. */
function offeredActiveSignals() {
  return toSlotRuleSignals({
    slotStatus: "offered",
    createdAt: "2026-04-10T10:00:00.000Z",
    nowMs: FIXED_NOW_MS,
    offers: [{ status: "sent", expires_at: "2026-04-16T14:00:00.000Z" }],
    claims: [],
    lastOfferBatchAt: "2026-04-16T11:00:00.000Z",
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
    resolutionStatus: "none",
  });
}

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    return;
  }
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setLoadSlotRuleContextTestDelegate(null);
  resetOpenSlotsRouteMutationTestDelegates();
});

test("POST /v1/open-slots/:id/confirm returns 409 operator_action_not_allowed when rules reject confirm", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setLoadSlotRuleContextTestDelegate(async (_admin, params) => {
    assert.equal(params.openSlotId, SLOT_ID);
    return {
      slot: {
        id: params.openSlotId,
        status: "claimed",
        business_id: params.businessId,
        created_at: "2026-04-10T10:00:00.000Z",
        last_offer_batch_at: null,
        resolution_status: "none",
      },
      signals: claimedSlotNoConfirmSignals(),
    };
  });

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/confirm`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: { claim_id: CLAIM_ID },
  });

  assert.equal(res.statusCode, 409);
  const body = res.json() as { error: { code: string; details?: Record<string, unknown> } };
  assert.equal(body.error.code, "operator_action_not_allowed");
  assert.equal(body.error.details?.attempted_action, "confirm_booking");
  assert.equal(body.error.details?.slot_status, "claimed");
  assert.ok(Array.isArray(body.error.details?.available_actions));
});

test("POST /v1/open-slots/:id/expire returns 409 operator_action_not_allowed for claimed slot", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setLoadSlotRuleContextTestDelegate(async (_admin, params) => {
    assert.equal(params.businessId, businessId());
    return {
      slot: {
        id: params.openSlotId,
        status: "claimed",
        business_id: params.businessId,
        created_at: "2026-04-10T10:00:00.000Z",
        last_offer_batch_at: null,
        resolution_status: "none",
      },
      signals: claimedAwaitingConfirmationSignals(),
    };
  });

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/expire`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 409);
  const body = res.json() as { error: { code: string; details?: Record<string, unknown> } };
  assert.equal(body.error.code, "operator_action_not_allowed");
  assert.equal(body.error.details?.attempted_action, "expire_slot");
});

test("POST /v1/open-slots/:id/send-offers returns 409 for offered_active (live offers block send and retry)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setLoadSlotRuleContextTestDelegate(async () => ({
    slot: {
      id: SLOT_ID,
      status: "offered",
      business_id: businessId(),
      created_at: "2026-04-10T10:00:00.000Z",
      last_offer_batch_at: "2026-04-16T11:00:00.000Z",
      resolution_status: "none",
    },
    signals: offeredActiveSignals(),
  }));

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/send-offers`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: {},
  });

  assert.equal(res.statusCode, 409);
  const body = res.json() as { error: { code: string; details?: Record<string, unknown> } };
  assert.equal(body.error.code, "operator_action_not_allowed");
  assert.deepEqual(body.error.details?.attempted_actions, ["send_offers", "retry_offers"]);
});

test("POST /v1/open-slots/:id/cancel returns legacy 404 not_found when slot is absent for business", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setLoadSlotRuleContextTestDelegate(async () => null);

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/cancel`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 404);
  const body = res.json() as { error: string };
  assert.equal(body.error, "not_found");
});

test("POST /v1/open-slots/:id/confirm returns 401 without Authorization", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/confirm`,
    headers: { "content-type": "application/json", "x-pulsefill-route-test": "1" },
    payload: { claim_id: CLAIM_ID },
  });

  assert.equal(res.statusCode, 401);
  const body = res.json() as { error: string };
  assert.equal(body.error, "unauthorized");
});

test("POST /v1/open-slots/:id/confirm returns 200 when guards pass and confirm mutation test delegate runs", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  let calls = 0;
  setConfirmOpenSlotMutationTestDelegate(async (args) => {
    calls += 1;
    assert.equal(args.openSlotId, SLOT_ID);
    assert.equal(args.claimId, CLAIM_ID);
    assert.equal(args.businessId, businessId());
  });

  setLoadSlotRuleContextTestDelegate(async (_admin, params) => ({
    slot: {
      id: params.openSlotId,
      status: "claimed",
      business_id: params.businessId,
      created_at: "2026-04-10T10:00:00.000Z",
      last_offer_batch_at: null,
      resolution_status: "none",
    },
    signals: claimedAwaitingConfirmationSignals(),
  }));

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/confirm`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: { claim_id: CLAIM_ID },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(calls, 1);
  const body = res.json() as { ok: boolean; result: string; status: string; claim_id: string; message: string };
  assert.equal(body.ok, true);
  assert.equal(body.result, "confirmed");
  assert.equal(body.status, "booked");
  assert.equal(body.claim_id, CLAIM_ID);
  assert.match(body.message, /confirmed/i);
});

test("POST /v1/open-slots/:id/send-offers returns 200 for first send when mutation test delegate runs", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  let calls = 0;
  setSendOffersMutationTestDelegate(async (args) => {
    calls += 1;
    assert.equal(args.openSlotId, SLOT_ID);
    assert.equal(args.previousStatus, "open");
    return {
      result: "offers_sent",
      matched: 2,
      offer_ids: [OFFER_ID_A, OFFER_ID_B],
      message: "Sent 2 offers.",
      notification_queue: { queued: false, count: 0 },
    };
  });

  setLoadSlotRuleContextTestDelegate(async () => ({
    slot: {
      id: SLOT_ID,
      status: "open",
      business_id: businessId(),
      created_at: "2026-04-10T10:00:00.000Z",
      last_offer_batch_at: null,
      resolution_status: "none",
    },
    signals: openUntouchedSignals(),
  }));

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/send-offers`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: {},
  });

  assert.equal(res.statusCode, 200);
  assert.equal(calls, 1);
  const body = res.json() as {
    ok: boolean;
    result: string;
    matched: number;
    offer_ids: string[];
    open_slot_id: string;
  };
  assert.equal(body.ok, true);
  assert.equal(body.result, "offers_sent");
  assert.equal(body.matched, 2);
  assert.deepEqual(body.offer_ids, [OFFER_ID_A, OFFER_ID_B]);
  assert.equal(body.open_slot_id, SLOT_ID);
});

test("POST /v1/open-slots/:id/send-offers returns 200 for retry path when mutation test delegate runs", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  let calls = 0;
  setSendOffersMutationTestDelegate(async (args) => {
    calls += 1;
    assert.equal(args.previousStatus, "open");
    return {
      result: "offers_retried",
      matched: 1,
      offer_ids: [OFFER_ID_A],
      message: "Retried 1 offer.",
      notification_queue: { queued: true, count: 1 },
    };
  });

  setLoadSlotRuleContextTestDelegate(async () => ({
    slot: {
      id: SLOT_ID,
      status: "open",
      business_id: businessId(),
      created_at: "2026-04-10T10:00:00.000Z",
      last_offer_batch_at: "2026-04-16T09:00:00.000Z",
      resolution_status: "none",
    },
    signals: openRetryableSignals(),
  }));

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/send-offers`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: {},
  });

  assert.equal(res.statusCode, 200);
  assert.equal(calls, 1);
  const body = res.json() as { ok: boolean; result: string; matched: number };
  assert.equal(body.ok, true);
  assert.equal(body.result, "offers_retried");
  assert.equal(body.matched, 1);
});
