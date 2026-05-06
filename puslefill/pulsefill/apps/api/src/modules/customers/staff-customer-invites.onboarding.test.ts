import assert from "node:assert/strict";
import test from "node:test";

import type { StaffCustomerInviteRow } from "./staff-customer-invites.service.js";
import { deriveInviteOnboardingStatus } from "./staff-customer-invites.service.js";

const BASE_ROW: StaffCustomerInviteRow = {
  id: "aaaaaaaa-bbbb-4ccc-8ddd-111111111111",
  email: "alex@example.com",
  customer_name: "Alex",
  status: "pending",
  expires_at: "2026-01-08T10:00:00.000Z",
  created_at: "2026-01-01T10:00:00.000Z",
  accepted_at: null,
  accepted_by_customer_id: null,
  invite_token: "tok",
};

function ctxForAccepted(customerId: string, opts: {
  activePrefs: number;
  reach: "reachable" | "limited" | "unreachable";
  membershipRevoked?: boolean;
  customerMissing?: boolean;
}) {
  const membership = new Map<string, { status: string }>();
  if (!opts.customerMissing) {
    membership.set(customerId, { status: opts.membershipRevoked ? "revoked" : "active" });
  }
  const activePrefCount = new Map<string, number>();
  if (opts.activePrefs > 0) {
    activePrefCount.set(customerId, opts.activePrefs);
  }
  const reachability = new Map<string, "reachable" | "limited" | "unreachable">();
  reachability.set(customerId, opts.reach);
  const customerExists = opts.customerMissing ? new Set<string>() : new Set([customerId]);
  return { membership, activePrefCount, reachability, customerExists };
}

test("deriveInviteOnboardingStatus: pending_invite", () => {
  const o = deriveInviteOnboardingStatus(BASE_ROW, null);
  assert.equal(o.key, "pending_invite");
  assert.equal(o.label, "Pending invite");
  assert.equal(o.tone, "neutral");
});

test("deriveInviteOnboardingStatus: expired", () => {
  const o = deriveInviteOnboardingStatus({ ...BASE_ROW, status: "expired", invite_token: null }, null);
  assert.equal(o.key, "expired");
});

test("deriveInviteOnboardingStatus: revoked", () => {
  const o = deriveInviteOnboardingStatus({ ...BASE_ROW, status: "revoked", invite_token: null }, null);
  assert.equal(o.key, "revoked");
});

test("deriveInviteOnboardingStatus: accepted_connection_issue when no customer id", () => {
  const o = deriveInviteOnboardingStatus(
    {
      ...BASE_ROW,
      status: "accepted",
      invite_token: null,
      accepted_at: "2026-01-02T10:00:00.000Z",
      accepted_by_customer_id: null,
    },
    null,
  );
  assert.equal(o.key, "accepted_connection_issue");
});

test("deriveInviteOnboardingStatus: accepted_connection_issue when customer row missing", () => {
  const cid = "cccccccc-bbbb-4ccc-8ddd-333333333333";
  const o = deriveInviteOnboardingStatus(
    {
      ...BASE_ROW,
      status: "accepted",
      invite_token: null,
      accepted_at: "2026-01-02T10:00:00.000Z",
      accepted_by_customer_id: cid,
    },
    ctxForAccepted(cid, { activePrefs: 1, reach: "reachable", customerMissing: true }),
  );
  assert.equal(o.key, "accepted_connection_issue");
});

test("deriveInviteOnboardingStatus: accepted_connection_issue when membership inactive", () => {
  const cid = "cccccccc-bbbb-4ccc-8ddd-333333333333";
  const o = deriveInviteOnboardingStatus(
    {
      ...BASE_ROW,
      status: "accepted",
      invite_token: null,
      accepted_at: "2026-01-02T10:00:00.000Z",
      accepted_by_customer_id: cid,
    },
    ctxForAccepted(cid, { activePrefs: 1, reach: "reachable", membershipRevoked: true }),
  );
  assert.equal(o.key, "accepted_connection_issue");
});

test("deriveInviteOnboardingStatus: accepted_needs_standby", () => {
  const cid = "cccccccc-bbbb-4ccc-8ddd-333333333333";
  const o = deriveInviteOnboardingStatus(
    {
      ...BASE_ROW,
      status: "accepted",
      invite_token: null,
      accepted_at: "2026-01-02T10:00:00.000Z",
      accepted_by_customer_id: cid,
    },
    ctxForAccepted(cid, { activePrefs: 0, reach: "reachable" }),
  );
  assert.equal(o.key, "accepted_needs_standby");
});

test("deriveInviteOnboardingStatus: accepted_not_reachable", () => {
  const cid = "cccccccc-bbbb-4ccc-8ddd-333333333333";
  const o = deriveInviteOnboardingStatus(
    {
      ...BASE_ROW,
      status: "accepted",
      invite_token: null,
      accepted_at: "2026-01-02T10:00:00.000Z",
      accepted_by_customer_id: cid,
    },
    ctxForAccepted(cid, { activePrefs: 2, reach: "unreachable" }),
  );
  assert.equal(o.key, "accepted_not_reachable");
});

test("deriveInviteOnboardingStatus: accepted_limited_reach", () => {
  const cid = "cccccccc-bbbb-4ccc-8ddd-333333333333";
  const o = deriveInviteOnboardingStatus(
    {
      ...BASE_ROW,
      status: "accepted",
      invite_token: null,
      accepted_at: "2026-01-02T10:00:00.000Z",
      accepted_by_customer_id: cid,
    },
    ctxForAccepted(cid, { activePrefs: 1, reach: "limited" }),
  );
  assert.equal(o.key, "accepted_limited_reach");
});

test("deriveInviteOnboardingStatus: accepted_standby_active", () => {
  const cid = "cccccccc-bbbb-4ccc-8ddd-333333333333";
  const o = deriveInviteOnboardingStatus(
    {
      ...BASE_ROW,
      status: "accepted",
      invite_token: null,
      accepted_at: "2026-01-02T10:00:00.000Z",
      accepted_by_customer_id: cid,
    },
    ctxForAccepted(cid, { activePrefs: 1, reach: "reachable" }),
  );
  assert.equal(o.key, "accepted_standby_active");
});
