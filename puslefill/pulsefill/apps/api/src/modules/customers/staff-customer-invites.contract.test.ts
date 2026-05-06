import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import type { StaffCustomerInviteCreateResponse, StaffCustomerInviteListResponse } from "./staff-customer-invites.service.js";
import {
  setCreateStaffCustomerInviteTestDelegate,
  setListStaffCustomerInvitesTestDelegate,
  setRevokeStaffCustomerInviteTestDelegate,
} from "./staff-customer-invites.service.js";

let app: FastifyInstance;

const LIST_SAMPLE: StaffCustomerInviteListResponse = {
  invites: [
    {
      id: "aaaaaaaa-bbbb-4ccc-8ddd-111111111111",
      code: "tok",
      invite_url: "https://app.example/invite?token=tok",
      customer_name: "Alex",
      customer_email: "alex@example.com",
      status: "pending",
      accepted_by_customer_id: null,
      created_at: "2026-01-01T10:00:00.000Z",
      expires_at: "2026-01-08T10:00:00.000Z",
      accepted_at: null,
      onboarding_status: {
        key: "pending_invite",
        label: "Pending invite",
        detail: "Customer has not accepted this invite yet.",
        tone: "neutral",
        next_action: { label: "Copy invite link", href: "/customers" },
      },
    },
    {
      id: "bbbbbbbb-bbbb-4ccc-8ddd-222222222222",
      code: null,
      invite_url: null,
      customer_name: null,
      customer_email: "bob@example.com",
      status: "accepted",
      accepted_by_customer_id: "cccccccc-bbbb-4ccc-8ddd-333333333333",
      created_at: "2026-01-02T10:00:00.000Z",
      expires_at: "2026-01-09T10:00:00.000Z",
      accepted_at: "2026-01-03T12:00:00.000Z",
      onboarding_status: {
        key: "accepted_needs_standby",
        label: "Accepted — needs standby setup",
        detail: "Customer is connected but has not chosen which openings they want.",
        tone: "attention",
        next_action: {
          label: "View customer",
          href: "/customers/cccccccc-bbbb-4ccc-8ddd-333333333333",
        },
      },
    },
  ],
};

const CREATE_SAMPLE: StaffCustomerInviteCreateResponse = {
  id: "dddddddd-bbbb-4ccc-8ddd-444444444444",
  code: "newtokenvalue",
  invite_url: null,
  customer_name: "Sam",
  customer_email: "sam@example.com",
  status: "pending",
  accepted_by_customer_id: null,
  created_at: "2026-01-10T10:00:00.000Z",
  expires_at: "2026-01-17T10:00:00.000Z",
  accepted_at: null,
  onboarding_status: {
    key: "pending_invite",
    label: "Pending invite",
    detail: "Customer has not accepted this invite yet.",
    tone: "neutral",
    next_action: { label: "Copy invite link", href: "/customers" },
  },
  one_time_token: "newtokenvalue",
  expires_in_days: 7,
};

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setListStaffCustomerInvitesTestDelegate(null);
  setCreateStaffCustomerInviteTestDelegate(null);
  setRevokeStaffCustomerInviteTestDelegate(null);
});

const BASES = ["/v1/customers/invites", "/v1/businesses/mine/customer-invites"] as const;

for (const base of BASES) {
  test(`GET ${base} returns 401 without auth`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;

    const res = await app.inject({ method: "GET", url: base });
    assert.equal(res.statusCode, 401);
  });

  test(`GET ${base} returns stable invite list shape`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;

    setListStaffCustomerInvitesTestDelegate(async () => LIST_SAMPLE);

    const res = await app.inject({ method: "GET", url: base, headers: routeTestHeaders() });
    assert.equal(res.statusCode, 200);
    const body = res.json() as StaffCustomerInviteListResponse;
    assert.ok(Array.isArray(body.invites));
    const itemKeys = [
      "accepted_at",
      "accepted_by_customer_id",
      "code",
      "created_at",
      "customer_email",
      "customer_name",
      "expires_at",
      "id",
      "invite_url",
      "onboarding_status",
      "status",
    ].sort();
    for (const inv of body.invites) {
      assert.deepEqual(Object.keys(inv).sort(), itemKeys);
      const os = inv.onboarding_status;
      assert.ok(os && typeof os === "object");
      assert.ok(typeof os.key === "string");
      assert.ok(typeof os.label === "string");
      assert.ok(typeof os.detail === "string");
      assert.ok(["neutral", "attention", "success", "warning", "muted"].includes(os.tone));
    }
    const raw = res.body;
    assert.ok(!raw.includes("token_hash"));
    assert.ok(!raw.toLowerCase().includes("device_token"));
  });

  test(`POST ${base} returns 401 without auth`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;

    const res = await app.inject({
      method: "POST",
      url: base,
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ email: "a@b.co" }),
    });
    assert.equal(res.statusCode, 401);
  });

  test(`POST ${base} returns 201 with code and one_time_token`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;

    setCreateStaffCustomerInviteTestDelegate(async () => CREATE_SAMPLE);

    const res = await app.inject({
      method: "POST",
      url: base,
      headers: { ...routeTestHeaders(), "content-type": "application/json" },
      payload: JSON.stringify({ email: "sam@example.com", customer_name: "Sam " }),
    });
    assert.equal(res.statusCode, 201);
    const body = res.json() as StaffCustomerInviteCreateResponse;
    assert.equal(body.code, body.one_time_token);
    assert.equal(body.customer_email, "sam@example.com");
    assert.equal(body.customer_name, "Sam");
    assert.equal(body.status, "pending");
    const raw = res.body;
    assert.ok(!raw.includes("token_hash"));
  });

  test(`POST ${base}/:inviteId/revoke returns 400 for invalid uuid`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;

    const res = await app.inject({
      method: "POST",
      url: `${base}/not-a-uuid/revoke`,
      headers: routeTestHeaders(),
    });
    assert.equal(res.statusCode, 400);
    assert.equal((res.json() as { error: string }).error, "invalid_invite_id");
  });

  test(`POST ${base}/:inviteId/revoke returns 404 when delegate returns null`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;

    setRevokeStaffCustomerInviteTestDelegate(async () => null);

    const res = await app.inject({
      method: "POST",
      url: `${base}/aaaaaaaa-bbbb-4ccc-8ddd-111111111111/revoke`,
      headers: routeTestHeaders(),
    });
    assert.equal(res.statusCode, 404);
    const j = res.json() as { error: string; request_id?: string };
    assert.equal(j.error, "not_found");
    assert.ok(j.request_id);
  });

  test(`POST ${base}/:inviteId/revoke returns 200 with invite`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;

    setRevokeStaffCustomerInviteTestDelegate(async () => ({
      ...LIST_SAMPLE.invites[0]!,
      status: "revoked",
      code: null,
      invite_url: null,
      onboarding_status: {
        key: "revoked",
        label: "Revoked",
        detail: "This invite can no longer be used.",
        tone: "muted",
        next_action: { label: "Create new invite", href: "/customers#invite-customer" },
      },
    }));

    const res = await app.inject({
      method: "POST",
      url: `${base}/aaaaaaaa-bbbb-4ccc-8ddd-111111111111/revoke`,
      headers: routeTestHeaders(),
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { invite: { status: string } };
    assert.equal(body.invite.status, "revoked");
  });
}
