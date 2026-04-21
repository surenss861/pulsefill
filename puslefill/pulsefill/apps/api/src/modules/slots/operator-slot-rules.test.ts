import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAvailableActions,
  buildQueueContext,
  canPerformAction,
  isWithinLastDays,
  toSlotRuleSignals,
  type SlotRuleSignals,
  type SlotRuleSignalsInput,
} from "./operator-slot-rules.js";

const baseTime = "2026-04-16T12:00:00.000Z";

function sig(overrides: Partial<SlotRuleSignalsInput> = {}): SlotRuleSignals {
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

test("isWithinLastDays is true within window", () => {
  assert.equal(isWithinLastDays("2026-04-15T12:00:00.000Z", "2026-04-16T12:00:00.000Z", 7), true);
});

test("awaiting_confirmation outranks delivery_failed", () => {
  const s = sig({
    slotStatus: "claimed",
    claims: [{ status: "won" }],
    latestFailedNotification: { error: "push failed" },
  });
  const q = buildQueueContext(s);
  assert.equal(q.current_category, "awaiting_confirmation");
  assert.equal(q.current_section, "needs_action");
});

test("delivery_failed for open with failed notification", () => {
  const s = sig({
    slotStatus: "open",
    latestFailedNotification: { error: "timeout" },
  });
  const q = buildQueueContext(s);
  assert.equal(q.current_category, "delivery_failed");
  const actions = buildAvailableActions(s, q);
  assert.ok(actions.includes("retry_offers"));
  assert.ok(!actions.includes("confirm_booking"));
});

test("offered_active with live offers excludes retry_offers", () => {
  const s = sig({
    slotStatus: "offered",
    offers: [{ status: "sent", expires_at: "2026-04-16T14:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-16T11:00:00.000Z",
  });
  const q = buildQueueContext(s);
  assert.equal(q.current_category, "offered_active");
  const actions = buildAvailableActions(s, q);
  assert.ok(!actions.includes("retry_offers"));
  assert.ok(actions.includes("inspect_notification_logs"));
});

test("no_matches applies to offered when audit present", () => {
  const s = sig({
    slotStatus: "offered",
    hasRecentNoMatchAudit: true,
    offers: [{ status: "failed", expires_at: "2026-04-16T10:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-16T09:00:00.000Z",
  });
  const q = buildQueueContext(s);
  assert.equal(q.current_category, "no_matches");
  assert.equal(q.current_section, "needs_action");
});

test("canPerformAction rejects confirm when not claimed", () => {
  const s = sig({ slotStatus: "open" });
  assert.equal(canPerformAction("confirm_booking", s), false);
});

test("canPerformAction allows expire only for open or offered", () => {
  assert.equal(canPerformAction("expire_slot", sig({ slotStatus: "open" })), true);
  assert.equal(canPerformAction("expire_slot", sig({ slotStatus: "booked" })), false);
});

test("retry_offers disallowed for offered_active (offered + live offers)", () => {
  const s = sig({
    slotStatus: "offered",
    offers: [{ status: "sent", expires_at: "2026-04-16T14:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-16T11:00:00.000Z",
  });
  assert.equal(canPerformAction("retry_offers", s), false);
  assert.equal(canPerformAction("send_offers", s), false);
});

test("retry_offers allowed for offered when no live offers", () => {
  const s = sig({
    slotStatus: "offered",
    offers: [{ status: "failed", expires_at: "2026-04-16T10:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-16T09:00:00.000Z",
  });
  assert.equal(canPerformAction("retry_offers", s), true);
});
