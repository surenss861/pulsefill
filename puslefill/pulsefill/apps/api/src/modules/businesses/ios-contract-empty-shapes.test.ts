import assert from "node:assert/strict";
import test from "node:test";

import { neutralActionQueueResponse } from "./action-queue.js";
import { neutralDailyOpsSummary } from "./daily-ops-summary.js";

test("neutralDailyOpsSummary returns stable iOS-safe metrics + breakdown", () => {
  const n = neutralDailyOpsSummary();
  assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof n.timezone, "string");
  assert.equal(n.metrics.recovered_bookings_today, 0);
  assert.equal(n.metrics.awaiting_confirmation_count, 0);
  assert.equal(n.metrics.delivery_failures_today, 0);
  assert.equal(n.metrics.no_matches_today, 0);
  assert.equal(n.metrics.active_offered_slots_count, 0);
  assert.deepEqual(Object.keys(n.breakdown.by_status).sort(), [
    "booked",
    "cancelled",
    "claimed",
    "expired",
    "offered",
    "open",
  ]);
  for (const k of Object.keys(n.breakdown.by_status)) {
    assert.equal(n.breakdown.by_status[k as keyof typeof n.breakdown.by_status], 0);
  }
});

test("neutralActionQueueResponse returns empty sections + zero summary", () => {
  const q = neutralActionQueueResponse();
  assert.equal(q.summary.needs_action_count, 0);
  assert.equal(q.summary.review_count, 0);
  assert.equal(q.summary.resolved_count, 0);
  assert.equal(q.summary.awaiting_confirmation_count, 0);
  assert.equal(q.summary.customer_follow_up_due_count, 0);
  assert.equal(q.sections.needs_action.length, 0);
  assert.equal(q.sections.review.length, 0);
  assert.equal(q.sections.resolved.length, 0);
  assert.equal(q.customer_follow_ups.length, 0);
});
