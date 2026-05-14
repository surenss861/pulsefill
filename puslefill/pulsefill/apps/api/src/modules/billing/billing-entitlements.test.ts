import assert from "node:assert/strict";
import test from "node:test";

import { computeBillingEntitlements } from "./billing-entitlements.js";

function assertAllOn(e: ReturnType<typeof computeBillingEntitlements>) {
  assert.equal(e.can_create_openings, true);
  assert.equal(e.can_send_offers, true);
  assert.equal(e.can_invite_customers, true);
  assert.equal(e.can_review_standby_requests, true);
  assert.equal(e.can_confirm_bookings, true);
}

function assertAllOff(e: ReturnType<typeof computeBillingEntitlements>) {
  assert.equal(e.can_create_openings, false);
  assert.equal(e.can_send_offers, false);
  assert.equal(e.can_invite_customers, false);
  assert.equal(e.can_review_standby_requests, false);
  assert.equal(e.can_confirm_bookings, false);
}

test("trialing: full access, no notice", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "trialing" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, false);
  assert.equal(e.status_reason, "trialing");
  assertAllOn(e);
});

test("active: full access, no notice", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "active" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, false);
  assert.equal(e.status_reason, "active");
  assertAllOn(e);
});

test("past_due: test env stays permissive", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "past_due" },
    nodeEnv: "test",
  });
  assert.equal(e.billing_notice_required, true);
  assert.equal(e.status_reason, "past_due");
  assertAllOn(e);
});

test("past_due: production blocks gated actions", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "past_due" },
    nodeEnv: "production",
  });
  assert.equal(e.billing_notice_required, true);
  assert.equal(e.status_reason, "past_due");
  assertAllOff(e);
});

test("canceled: test permissive; production blocks", () => {
  const dev = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "canceled" },
    nodeEnv: "test",
  });
  assert.equal(dev.status_reason, "canceled");
  assertAllOn(dev);

  const prod = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "canceled" },
    nodeEnv: "production",
  });
  assertAllOff(prod);
});

test("incomplete: production blocks", () => {
  const e = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: { status: "incomplete" },
    nodeEnv: "production",
  });
  assert.equal(e.status_reason, "incomplete");
  assertAllOff(e);
});

test("no subscription: test permissive; production blocks", () => {
  const t = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: null,
    nodeEnv: "test",
  });
  assert.equal(t.status_reason, "no_subscription");
  assertAllOn(t);

  const p = computeBillingEntitlements({
    stripe_billing_available: true,
    subscription: null,
    nodeEnv: "production",
  });
  assertAllOff(p);
});

test("billing_unavailable: notice only in production; production gates", () => {
  const dev = computeBillingEntitlements({
    stripe_billing_available: false,
    subscription: null,
    nodeEnv: "development",
  });
  assert.equal(dev.status_reason, "billing_unavailable");
  assert.equal(dev.billing_notice_required, false);
  assertAllOn(dev);

  const prod = computeBillingEntitlements({
    stripe_billing_available: false,
    subscription: null,
    nodeEnv: "production",
  });
  assert.equal(prod.status_reason, "billing_unavailable");
  assert.equal(prod.billing_notice_required, true);
  assertAllOff(prod);
});
