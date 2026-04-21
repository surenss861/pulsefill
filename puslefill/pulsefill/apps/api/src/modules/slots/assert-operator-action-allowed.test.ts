import assert from "node:assert/strict";
import test from "node:test";

import { buildOperatorActionRejectionDetails } from "./assert-operator-action-allowed.js";
import { toSlotRuleSignals, type SlotRuleSignalsInput } from "./operator-slot-rules.js";

const baseTime = "2026-04-16T12:00:00.000Z";

function signals(overrides: Partial<SlotRuleSignalsInput> = {}) {
  return toSlotRuleSignals({
    slotStatus: "open",
    createdAt: "2026-04-10T10:00:00.000Z",
    nowMs: Date.parse(baseTime),
    offers: [],
    claims: [],
    lastOfferBatchAt: null,
    latestFailedNotification: null,
    hasRecentNoMatchAudit: false,
    resolutionStatus: "none",
    ...overrides,
  });
}

test("buildOperatorActionRejectionDetails includes attempted_action and available_actions", () => {
  const s = signals({
    slotStatus: "booked",
    createdAt: "2026-03-01T10:00:00.000Z",
  });
  const d = buildOperatorActionRejectionDetails("confirm_booking", s);
  assert.equal(d.attempted_action, "confirm_booking");
  assert.equal(d.slot_status, "booked");
  assert.equal(d.queue_category, null);
  assert.ok(Array.isArray(d.available_actions));
  assert.ok(!d.available_actions.includes("confirm_booking"));
});

test("buildOperatorActionRejectionDetails for offered_active lists queue_category", () => {
  const s = signals({
    slotStatus: "offered",
    offers: [{ status: "sent", expires_at: "2026-04-16T14:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-16T11:00:00.000Z",
  });
  const d = buildOperatorActionRejectionDetails("retry_offers", s);
  assert.equal(d.queue_category, "offered_active");
  assert.ok(!d.available_actions.includes("retry_offers"));
  assert.ok(d.available_actions.includes("inspect_notification_logs"));
});
