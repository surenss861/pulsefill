import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRejectionBreakdown,
  buildRetryGuidance,
  rejectionLabelForReason,
} from "./no-match-explanation.js";

const SLOT = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SLOT_HREF = `/open-slots/${SLOT}`;

test("rejectionLabelForReason covers matcher codes with staff-safe copy", () => {
  assert.equal(rejectionLabelForReason("service_mismatch"), "Service did not match");
  assert.equal(rejectionLabelForReason("no_active_membership"), "Customer not actively connected");
  assert.ok(!rejectionLabelForReason("unknown_future_reason").includes("customer_id"));
});

test("buildRejectionBreakdown sorts by count descending and skips matched", () => {
  const rows = buildRejectionBreakdown({
    service_mismatch: 2,
    location_mismatch: 5,
    matched: 1,
  });
  assert.deepEqual(
    rows.map((r) => r.reason),
    ["location_mismatch", "service_mismatch"],
  );
  assert.equal(rows[0]?.count, 5);
});

function bd(reason: string, count: number, label: string) {
  return { reason, count, label };
}

test("buildRetryGuidance: empty explanation uses stable generic hrefs", () => {
  const g = buildRetryGuidance(SLOT, null, [], false);
  assert.match(g.headline, /unlock retry tips/);
  const hrefs = g.recommended_actions.map((a) => a.href);
  assert.ok(hrefs.includes(SLOT_HREF));
  assert.ok(hrefs.some((h) => h.startsWith("/customers")));
  assert.ok(hrefs.includes("/overview"));
  assert.equal(g.recommended_actions.filter((a) => a.priority === "primary").length, 1);
});

test("buildRetryGuidance: no_active_preferences headline and invite primary", () => {
  const g = buildRetryGuidance(SLOT, "no_active_preferences", [bd("no_active_preferences", 4, "x")], true);
  assert.equal(g.headline, "No standby preferences yet");
  assert.equal(g.recommended_actions[0]?.key, "invite");
  assert.equal(g.recommended_actions[0]?.href, "/customers#invite-customer");
  assert.equal(g.recommended_actions[0]?.priority, "primary");
});

test("buildRetryGuidance: duplicate dominant beats other breakdown rows", () => {
  const g = buildRetryGuidance(
    SLOT,
    "no_matching_standby_customers",
    [bd("duplicate_offer", 10, "x"), bd("service_mismatch", 3, "y")],
    true,
  );
  assert.equal(g.headline, "Customers were already offered this opening");
  assert.equal(g.recommended_actions[0]?.key, "delivery_status");
  assert.equal(g.recommended_actions[0]?.href, SLOT_HREF);
});

test("buildRetryGuidance: no_active_membership uses standby-requests href", () => {
  const g = buildRetryGuidance(SLOT, "no_matching_standby_customers", [bd("no_active_membership", 2, "x")], true);
  assert.match(g.headline, /actively connected/);
  const req = g.recommended_actions.find((a) => a.key === "standby_requests");
  assert.equal(req?.href, "/customers/standby-requests");
  assert.equal(req?.priority, "primary");
});

test("buildRetryGuidance: notice_window headline without raw reason codes in copy", () => {
  const g = buildRetryGuidance(SLOT, "no_matching_standby_customers", [bd("notice_window_mismatch", 1, "x")], true);
  assert.match(g.headline, /notice/i);
  assert.ok(!g.message.includes("notice_window_mismatch"));
  assert.ok(!g.headline.includes("notice_window"));
});

test("buildRetryGuidance: at most one primary action", () => {
  const g = buildRetryGuidance(SLOT, "no_matching_standby_customers", [bd("outside_availability_time", 2, "x")], true);
  assert.equal(g.recommended_actions.filter((a) => a.priority === "primary").length, 1);
});
