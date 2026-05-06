import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateNoMatchReasons,
  computeSuggestedFocus,
  topReasonsFromCounts,
} from "./recovery-insights.js";

test("aggregateNoMatchReasons tallies coarse codes from audit metadata", () => {
  const rows = [
    { metadata: { no_matches_reason: "no_active_preferences" } },
    { metadata: { no_matches_reason: "no_matching_standby_customers" } },
    { metadata: { no_matches_reason: "no_active_preferences" } },
    { metadata: {} },
  ];
  const m = aggregateNoMatchReasons(rows);
  assert.equal(m.get("no_active_preferences"), 2);
  assert.equal(m.get("no_matching_standby_customers"), 1);
});

test("topReasonsFromCounts sorts by count then reason code", () => {
  const m = new Map([
    ["b_reason", 2],
    ["a_reason", 2],
  ]);
  const top = topReasonsFromCounts(m, 10);
  assert.equal(top[0]?.reason, "a_reason");
});

test("computeSuggestedFocus prefers delivery failures when elevated", () => {
  const f = computeSuggestedFocus({
    recovered_count_30d: 10,
    missed_count_30d: 1,
    no_match_count_30d: 2,
    delivery_failure_count_30d: 6,
    top_no_match_reasons: [],
    thin_services: [],
  });
  assert.equal(f.key, "notification_reliability");
  assert.equal(f.href, "/activity");
});

test("computeSuggestedFocus highlights standby when prefs dominate", () => {
  const f = computeSuggestedFocus({
    recovered_count_30d: 4,
    missed_count_30d: 1,
    no_match_count_30d: 10,
    delivery_failure_count_30d: 0,
    top_no_match_reasons: [{ reason: "no_active_preferences", count: 5, label: "x" }],
    thin_services: [],
  });
  assert.equal(f.key, "standby_pool");
  assert.equal(f.href, "/customers#invite-customer");
});
