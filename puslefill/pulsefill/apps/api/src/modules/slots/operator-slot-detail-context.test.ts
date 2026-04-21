import assert from "node:assert/strict";
import test from "node:test";

import {
  baseSignalsFromOpenSlotRow,
  buildOperatorAvailableActions,
  buildOperatorSlotQueueContext,
} from "./operator-slot-detail-context.js";

const nowMs = Date.parse("2026-04-16T12:00:00.000Z");

test("baseSignalsFromOpenSlotRow maps nested offers and claims", () => {
  const row = {
    status: "offered",
    created_at: "2026-04-10T10:00:00.000Z",
    last_offer_batch_at: "2026-04-16T09:00:00.000Z",
    resolution_status: "none",
    slot_offers: [{ status: "sent", expires_at: "2026-04-16T14:00:00.000Z" }],
    slot_claims: [
      {
        id: "c1",
        status: "won",
        customer_id: "cust-1",
        claimed_at: "2026-04-16T10:00:00.000Z",
      },
    ],
  };
  const base = baseSignalsFromOpenSlotRow(row);
  assert.equal(base.slotStatus, "offered");
  assert.equal(base.slotCreatedAt, "2026-04-10T10:00:00.000Z");
  assert.equal(base.lastOfferBatchAt, "2026-04-16T09:00:00.000Z");
  assert.equal(base.resolutionStatus, "none");
  assert.equal(base.offers.length, 1);
  assert.equal(base.claims.length, 1);
});

test("buildOperatorSlotQueueContext uses same classification as rules (awaiting_confirmation)", () => {
  const detail = {
    slotStatus: "claimed",
    slotCreatedAt: "2026-04-10T10:00:00.000Z",
    lastOfferBatchAt: "2026-04-16T09:00:00.000Z",
    resolutionStatus: "none",
    offers: [],
    claims: [{ id: "c1", status: "won", customer_id: "x", claimed_at: "2026-04-16T10:00:00.000Z" }],
    latestFailedNotification: { error: "timeout", created_at: "2026-04-16T11:00:00.000Z" },
    hasRecentNoMatchAudit: false,
  };
  const q = buildOperatorSlotQueueContext(detail, nowMs);
  assert.equal(q.current_category, "awaiting_confirmation");
  assert.equal(q.current_section, "needs_action");
  assert.ok(q.reason_title);
});

test("buildOperatorAvailableActions for booked within 7d window includes utilities only", () => {
  const detail = {
    slotStatus: "booked",
    slotCreatedAt: "2026-04-15T10:00:00.000Z",
    lastOfferBatchAt: null,
    resolutionStatus: "none",
    offers: [],
    claims: [],
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
  };
  const q = buildOperatorSlotQueueContext(detail, nowMs);
  assert.equal(q.current_category, "confirmed_booking");
  const actions = buildOperatorAvailableActions(detail, q, nowMs);
  assert.ok(actions.includes("add_note"));
  assert.ok(!actions.includes("send_offers"));
  assert.ok(!actions.includes("confirm_booking"));
});

test("buildOperatorSlotQueueContext null category for old booked slot", () => {
  const detail = {
    slotStatus: "booked",
    slotCreatedAt: "2026-03-01T10:00:00.000Z",
    lastOfferBatchAt: null,
    resolutionStatus: "none",
    offers: [],
    claims: [],
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
  };
  const q = buildOperatorSlotQueueContext(detail, nowMs);
  assert.equal(q.current_category, null);
  const actions = buildOperatorAvailableActions(detail, q, nowMs);
  assert.ok(actions.includes("add_note"));
});
