import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOutcomesLeaks,
  buildOutcomesMix,
  buildOutcomesScorecards,
} from "../modules/businesses/outcomes-data-trust.js";
import {
  claimStatusToEventKind,
  offerRowStatusToFeedKind,
} from "../modules/customers/activity-feed.js";
import {
  buildAvailableActions,
  buildQueueContext,
  canPerformAction,
  toSlotRuleSignals,
  type SlotRuleSignals,
} from "../modules/slots/operator-slot-rules.js";

const NOW_MS = Date.parse("2026-04-25T12:00:00.000Z");

function scenarioSignals(input: {
  slotStatus: string;
  offers?: Array<{ status: string; expires_at: string }>;
  claims?: Array<{ status: string }>;
  lastOfferBatchAt?: string | null;
  latestFailedNotification?: { error: string | null } | null;
  hasRecentNoMatchAudit?: boolean;
}): SlotRuleSignals {
  return toSlotRuleSignals({
    slotStatus: input.slotStatus,
    createdAt: "2026-04-24T12:00:00.000Z",
    nowMs: NOW_MS,
    offers: input.offers ?? [],
    claims: input.claims ?? [],
    lastOfferBatchAt: input.lastOfferBatchAt ?? null,
    latestFailedNotification: input.latestFailedNotification ?? null,
    hasRecentNoMatchAudit: input.hasRecentNoMatchAudit ?? false,
    resolutionStatus: "none",
  });
}

test("confirmed booking stays coherent across outcomes, activity, queue, and detail actions", () => {
  const signals = scenarioSignals({
    slotStatus: "booked",
    claims: [{ status: "confirmed" }],
  });

  const queue = buildQueueContext(signals);
  const actions = buildAvailableActions(signals, queue);
  const activityKind = claimStatusToEventKind("confirmed", "booked");
  const scorecards = buildOutcomesScorecards({
    metrics: {
      recovered_bookings_today: 1,
      recovered_revenue_cents_today: 12500,
      awaiting_confirmation_count: 0,
      no_matches_today: 0,
      delivery_failures_today: 0,
    },
    expiredUnfilled: 0,
    openSlotsCreated30d: 2,
    slotsBooked30d: 1,
  });

  assert.equal(activityKind, "booking_confirmed");
  assert.equal(scorecards.recoveredBookings, 1);
  assert.equal(scorecards.recoveredRevenue, "$125");
  assert.equal(queue.current_section, "resolved");
  assert.ok(!actions.includes("confirm_booking"));
  assert.equal(canPerformAction("confirm_booking", signals), false);
});

test("claimed pending confirmation is needs-action and not yet recovered", () => {
  const signals = scenarioSignals({
    slotStatus: "claimed",
    claims: [{ status: "won" }],
  });

  const queue = buildQueueContext(signals);
  const actions = buildAvailableActions(signals, queue);
  const activityKind = claimStatusToEventKind("won", "claimed");
  const scorecards = buildOutcomesScorecards({
    metrics: {
      recovered_bookings_today: 0,
      recovered_revenue_cents_today: 0,
      awaiting_confirmation_count: 1,
      no_matches_today: 0,
      delivery_failures_today: 0,
    },
    expiredUnfilled: 0,
    openSlotsCreated30d: 3,
    slotsBooked30d: 0,
  });

  assert.equal(queue.current_category, "awaiting_confirmation");
  assert.equal(queue.current_section, "needs_action");
  assert.ok(actions.includes("confirm_booking"));
  assert.equal(canPerformAction("confirm_booking", signals), true);
  assert.equal(activityKind, "claim_pending_confirmation");
  assert.equal(scorecards.recoveredBookings, 0);
});

test("offered active keeps retry blocked and avoids recovered/lost outcomes", () => {
  const signals = scenarioSignals({
    slotStatus: "offered",
    offers: [{ status: "sent", expires_at: "2026-04-25T14:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-25T11:00:00.000Z",
  });

  const queue = buildQueueContext(signals);
  const actions = buildAvailableActions(signals, queue);
  const offerKind = offerRowStatusToFeedKind("sent");
  const mix = buildOutcomesMix(
    {
      recovered_bookings_today: 0,
      recovered_revenue_cents_today: 0,
      awaiting_confirmation_count: 0,
      no_matches_today: 0,
      delivery_failures_today: 0,
    },
    0,
  );

  assert.equal(queue.current_category, "offered_active");
  assert.equal(queue.current_section, "review");
  assert.ok(!actions.includes("retry_offers"));
  assert.equal(canPerformAction("retry_offers", signals), false);
  assert.equal(offerKind, "offer_received");
  assert.equal(mix.find((row) => row.label === "Recovered")?.value, 0);
  assert.equal(mix.find((row) => row.label === "Expired unfilled")?.value, 0);
});

test("expired unfilled remains non-recoverable across outcomes, activity, queue, and actions", () => {
  const signals = scenarioSignals({
    slotStatus: "expired",
    offers: [{ status: "expired", expires_at: "2026-04-25T10:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-25T09:00:00.000Z",
  });

  const queue = buildQueueContext(signals);
  const actions = buildAvailableActions(signals, queue);
  const offerKind = offerRowStatusToFeedKind("expired");
  const mix = buildOutcomesMix(
    {
      recovered_bookings_today: 0,
      recovered_revenue_cents_today: 0,
      awaiting_confirmation_count: 0,
      no_matches_today: 0,
      delivery_failures_today: 0,
    },
    1,
  );

  assert.equal(queue.current_category, "expired_unfilled");
  assert.ok(!actions.includes("send_offers"));
  assert.ok(!actions.includes("retry_offers"));
  assert.equal(canPerformAction("confirm_booking", signals), false);
  assert.equal(offerKind, "offer_expired");
  assert.equal(mix.find((row) => row.label === "Expired unfilled")?.value, 1);
});

test("delivery failure is consistently needs-action with leak visibility", () => {
  const signals = scenarioSignals({
    slotStatus: "open",
    offers: [{ status: "failed", expires_at: "2026-04-25T10:00:00.000Z" }],
    lastOfferBatchAt: "2026-04-25T09:00:00.000Z",
    latestFailedNotification: { error: "push_provider_timeout" },
  });

  const queue = buildQueueContext(signals);
  const actions = buildAvailableActions(signals, queue);
  const leaks = buildOutcomesLeaks({
    recovered_bookings_today: 0,
    recovered_revenue_cents_today: 0,
    awaiting_confirmation_count: 0,
    no_matches_today: 1,
    delivery_failures_today: 2,
  });
  const activityKind = offerRowStatusToFeedKind("failed");

  assert.equal(queue.current_category, "delivery_failed");
  assert.equal(queue.current_section, "needs_action");
  assert.ok(actions.includes("retry_offers"));
  assert.ok(actions.includes("inspect_notification_logs"));
  assert.equal(activityKind, "offer_expired");
  assert.equal(leaks[0]?.title, "Delivery failures");
  assert.equal(leaks[0]?.value, 2);
});
