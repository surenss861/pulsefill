import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOutcomesLeaks,
  buildOutcomesMix,
  buildOutcomesPerformanceRows,
  buildOutcomesScorecards,
  formatOutcomesWindowLabel,
  formatUsdFromCents,
} from "./outcomes-data-trust.js";

test("formatOutcomesWindowLabel builds stable day label", () => {
  assert.equal(formatOutcomesWindowLabel("2026-04-25"), "Today - Apr 25, 2026");
});

test("buildOutcomesScorecards computes recovery and revenue from inputs", () => {
  const scorecards = buildOutcomesScorecards({
    metrics: {
      recovered_bookings_today: 4,
      recovered_revenue_cents_today: 45500,
      awaiting_confirmation_count: 2,
      no_matches_today: 1,
      delivery_failures_today: 3,
    },
    expiredUnfilled: 5,
    openSlotsCreated30d: 10,
    slotsBooked30d: 6,
  });

  assert.equal(scorecards.recoveredBookings, 4);
  assert.equal(scorecards.recoveredRevenue, "$455");
  assert.equal(scorecards.recoveryRate, "60%");
  assert.equal(scorecards.expiredUnfilled, 5);
  assert.equal(scorecards.deliveryFailures, 3);
});

test("buildOutcomesScorecards clamps zero denominator to 0%", () => {
  const scorecards = buildOutcomesScorecards({
    metrics: {
      recovered_bookings_today: 0,
      recovered_revenue_cents_today: 0,
      awaiting_confirmation_count: 0,
      no_matches_today: 0,
      delivery_failures_today: 0,
    },
    expiredUnfilled: 0,
    openSlotsCreated30d: 0,
    slotsBooked30d: 0,
  });

  assert.equal(scorecards.recoveryRate, "0%");
});

test("buildOutcomesLeaks sorts leak cards by value descending", () => {
  const leaks = buildOutcomesLeaks({
    recovered_bookings_today: 2,
    recovered_revenue_cents_today: 10000,
    awaiting_confirmation_count: 1,
    no_matches_today: 6,
    delivery_failures_today: 3,
  });

  assert.equal(leaks.length, 3);
  assert.equal(leaks[0]?.title, "No matches");
  assert.equal(leaks[1]?.title, "Delivery failures");
  assert.equal(leaks[2]?.title, "Unconfirmed claims");
});

test("buildOutcomesMix marks dangerous rows based on counts", () => {
  const mix = buildOutcomesMix(
    {
      recovered_bookings_today: 1,
      recovered_revenue_cents_today: 100,
      awaiting_confirmation_count: 2,
      no_matches_today: 3,
      delivery_failures_today: 0,
    },
    2,
  );

  const expired = mix.find((row) => row.label === "Expired unfilled");
  const failures = mix.find((row) => row.label === "Delivery failures");

  assert.equal(expired?.emphasis, "danger");
  assert.equal(failures?.emphasis, "default");
});

test("buildOutcomesPerformanceRows computes loss and keeps only meaningful rows", () => {
  const rows = buildOutcomesPerformanceRows([
    { label: "A", recovered_bookings: 3, no_matches: 1, delivery_failures: 1 },
    { label: "", recovered_bookings: 0, no_matches: 0, delivery_failures: 0 },
    { label: "B", recovered_bookings: 1, no_matches: 2, delivery_failures: 0 },
  ]);

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.label, "A");
  assert.equal(rows[0]?.lost, 2);
  assert.equal(rows[0]?.rate, "60%");
  assert.equal(rows[1]?.label, "B");
  assert.equal(rows[1]?.rate, "33%");
});

test("formatUsdFromCents formats currency and compact thresholds", () => {
  assert.equal(formatUsdFromCents(12345), "$123.45");
  assert.equal(formatUsdFromCents(100000), "$1.0K");
});
