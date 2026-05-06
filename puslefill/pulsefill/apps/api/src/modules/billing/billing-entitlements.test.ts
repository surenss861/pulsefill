import assert from "node:assert/strict";
import test from "node:test";

import { computeBillingEntitlements } from "./billing-entitlements.js";

test("trialing: full access, no notice", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "trialing" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, false);
  assert.equal(e.status_reason, "trialing");
  assert.equal(e.can_create_openings, true);
  assert.equal(e.can_send_offers, true);
  assert.equal(e.can_invite_customers, true);
});

test("active: full access, no notice", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "active" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, false);
  assert.equal(e.status_reason, "active");
});

test("past_due: permissive caps, notice required", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "past_due" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, true);
  assert.equal(e.status_reason, "past_due");
  assert.equal(e.can_send_offers, true);
  assert.ok(e.notice.message.length > 10);
});

test("canceled: notice required, still permissive", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "canceled" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, true);
  assert.equal(e.status_reason, "canceled");
  assert.equal(e.can_create_openings, true);
});

test("incomplete: notice required", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "incomplete" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, true);
  assert.equal(e.status_reason, "incomplete");
});

test("no subscription: notice required", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: null,
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, true);
  assert.equal(e.status_reason, "no_subscription");
});

test("billing_unavailable: notice only in production", () => {
  const dev = computeBillingEntitlements({
    stripe_billing_available: false,
    subscription: null,
    nodeEnv: "development",
  });
  assert.equal(dev.status_reason, "billing_unavailable");
  assert.equal(dev.billing_notice_required, false);

  const prod = computeBillingEntitlements({
    stripe_billing_available: false,
    subscription: null,
    nodeEnv: "production",
  });
  assert.equal(prod.status_reason, "billing_unavailable");
  assert.equal(prod.billing_notice_required, true);
});
