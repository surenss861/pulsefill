import assert from "node:assert/strict";
import test from "node:test";

import {
  baseSignalsFromOpenSlotRow,
  buildOperatorAvailableActions,
  buildOperatorSlotQueueContext,
  type OperatorSlotAvailableAction,
  type OperatorSlotDetailSignals,
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

test("state matrix keeps detail action exposure aligned with rules", () => {
  const scenarios: Array<{
    label: string;
    detail: OperatorSlotDetailSignals;
    shouldInclude: OperatorSlotAvailableAction[];
    shouldExclude: OperatorSlotAvailableAction[];
  }> = [
    {
      label: "claimed pending confirmation",
      detail: {
        slotStatus: "claimed",
        slotCreatedAt: "2026-04-15T10:00:00.000Z",
        lastOfferBatchAt: "2026-04-16T09:00:00.000Z",
        resolutionStatus: "none",
        offers: [],
        claims: [{ id: "c1", status: "won", customer_id: "x", claimed_at: "2026-04-16T10:00:00.000Z" }],
        latestFailedNotification: null,
        hasRecentNoMatchAudit: false,
      },
      shouldInclude: ["confirm_booking"],
      shouldExclude: ["send_offers", "retry_offers"],
    },
    {
      label: "offered with live offers",
      detail: {
        slotStatus: "offered",
        slotCreatedAt: "2026-04-15T10:00:00.000Z",
        lastOfferBatchAt: "2026-04-16T09:00:00.000Z",
        resolutionStatus: "none",
        offers: [{ status: "sent", expires_at: "2026-04-16T14:00:00.000Z" }],
        claims: [],
        latestFailedNotification: null,
        hasRecentNoMatchAudit: false,
      },
      shouldInclude: [],
      shouldExclude: ["send_offers", "retry_offers", "confirm_booking"],
    },
    {
      label: "open clean slot",
      detail: {
        slotStatus: "open",
        slotCreatedAt: "2026-04-15T10:00:00.000Z",
        lastOfferBatchAt: null,
        resolutionStatus: "none",
        offers: [],
        claims: [],
        latestFailedNotification: null,
        hasRecentNoMatchAudit: false,
      },
      shouldInclude: ["send_offers"],
      shouldExclude: ["confirm_booking"],
    },
    {
      label: "booked slot",
      detail: {
        slotStatus: "booked",
        slotCreatedAt: "2026-04-15T10:00:00.000Z",
        lastOfferBatchAt: null,
        resolutionStatus: "none",
        offers: [],
        claims: [],
        latestFailedNotification: null,
        hasRecentNoMatchAudit: false,
      },
      shouldInclude: [],
      shouldExclude: ["confirm_booking", "send_offers", "retry_offers"],
    },
    {
      label: "expired slot",
      detail: {
        slotStatus: "expired",
        slotCreatedAt: "2026-04-15T10:00:00.000Z",
        lastOfferBatchAt: "2026-04-15T09:00:00.000Z",
        resolutionStatus: "none",
        offers: [],
        claims: [],
        latestFailedNotification: null,
        hasRecentNoMatchAudit: false,
      },
      shouldInclude: [],
      shouldExclude: ["confirm_booking", "send_offers", "retry_offers", "expire_slot", "cancel_slot"],
    },
  ];

  for (const scenario of scenarios) {
    const queue = buildOperatorSlotQueueContext(scenario.detail, nowMs);
    const actions = buildOperatorAvailableActions(scenario.detail, queue, nowMs);
    for (const action of scenario.shouldInclude) {
      assert.ok(actions.includes(action), `${scenario.label} should include ${action}`);
    }
    for (const action of scenario.shouldExclude) {
      assert.ok(!actions.includes(action), `${scenario.label} should exclude ${action}`);
    }
  }
});
