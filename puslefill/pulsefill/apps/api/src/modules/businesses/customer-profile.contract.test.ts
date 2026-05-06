import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import type { CustomerProfileResponse } from "./customer-profile.js";
import { setBuildCustomerProfileTestDelegate } from "./customer-profile.js";

let app: FastifyInstance;

const CUSTOMER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-111111111111";

const SAMPLE: CustomerProfileResponse = {
  customer: {
    id: CUSTOMER_ID,
    display_name: "Test Customer",
    email: "te…@example.com",
    phone: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  membership: { status: "active", source: "invite", joined_at: "2026-01-02T00:00:00.000Z" },
  follow_up: {
    contact_email: "test@example.com",
    contact_phone: null,
    can_email: true,
    can_call: false,
    suggested_action: "none",
  },
  standby: {
    active_preferences_count: 1,
    services: [{ id: "bbbbbbbb-bbbb-4ccc-8ddd-222222222222", name: "Consultation" }],
    locations: [{ id: "cccccccc-bbbb-4ccc-8ddd-333333333333", name: "Downtown" }],
    notice_summary: "About 2h notice",
    availability_summary: "Mon · 09:00–17:00",
  },
  reachability: {
    push_enabled: true,
    active_push_devices: 1,
    email_enabled: true,
    sms_enabled: false,
    status: "reachable",
  },
  claims: { total: 2, confirmed: 1, waiting: 1, expired_or_missed: 0 },
  recent_activity: [
    {
      kind: "claim_sent",
      title: "Claim sent",
      description: "Customer claimed an opening.",
      occurred_at: "2026-01-10T12:00:00.000Z",
    },
  ],
  notification_delivery: { sent_30d: 3, failed_30d: 0, skipped_30d: 1 },
  next_actions: [{ label: "Back to customers", href: "/customers", priority: "secondary" }],
};

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setBuildCustomerProfileTestDelegate(null);
});

test("GET /v1/businesses/mine/customers/:id/profile returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/profile`,
  });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/businesses/mine/customers/:id/profile returns 400 for invalid id", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/customers/not-a-uuid/profile",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 400);
  const body = res.json() as { error: string };
  assert.equal(body.error, "invalid_customer_id");
});

test("GET /v1/businesses/mine/customers/:id/profile returns stable payload and no token leakage", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildCustomerProfileTestDelegate(async () => SAMPLE);

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/profile`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as CustomerProfileResponse;
  assert.equal(body.customer.id, CUSTOMER_ID);
  assert.ok(["active", "pending", "revoked", "none"].includes(body.membership.status));
  assert.equal(typeof body.standby.active_preferences_count, "number");
  assert.ok(["reachable", "limited", "unreachable"].includes(body.reachability.status));
  assert.equal(typeof body.claims.total, "number");
  assert.ok(Array.isArray(body.recent_activity));
  assert.equal(typeof body.notification_delivery.sent_30d, "number");
  assert.equal(typeof body.follow_up.can_email, "boolean");
  assert.equal(typeof body.follow_up.can_call, "boolean");
  assert.ok(["review_request", "invite_customer", "none"].includes(body.follow_up.suggested_action));
  assert.deepEqual(
    Object.keys(body.follow_up as Record<string, unknown>).sort(),
    ["can_call", "can_email", "contact_email", "contact_phone", "suggested_action"].sort(),
  );

  const raw = res.body;
  assert.ok(!raw.includes("device_token"));
  assert.ok(!raw.toLowerCase().includes("apns"));
});

test("GET /v1/businesses/mine/customers/:id/profile returns 404 when not in business context", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildCustomerProfileTestDelegate(async () => {
    throw new Error("customer_profile_not_found");
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/profile`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 404);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "not_found");
  assert.ok(body.request_id && typeof body.request_id === "string");
});

test("GET /v1/businesses/mine/customers/:id/profile returns 500 when delegate throws", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildCustomerProfileTestDelegate(async () => {
    throw new Error("boom");
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/profile`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 500);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "customer_profile_failed");
  assert.ok(body.request_id && typeof body.request_id === "string");
});
