import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import type { BillingSummaryResponse } from "./billing-summary.js";
import { setGetBillingSummaryTestDelegate } from "./billing-summary.js";

let app: FastifyInstance;

const SAMPLE: BillingSummaryResponse = {
  stripe_billing_available: true,
  billing_portal_available: false,
  subscription_checkout_available: false,
  subscription: {
    plan: "starter",
    status: "trialing",
    current_period_end: "2026-06-01T12:00:00.000Z",
    stripe_customer_linked: true,
    stripe_subscription_linked: false,
  },
};

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setGetBillingSummaryTestDelegate(null);
});

test("GET /v1/billing/summary returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({ method: "GET", url: "/v1/billing/summary" });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/billing/summary returns stable shape and no Stripe id leakage", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setGetBillingSummaryTestDelegate(async () => SAMPLE);

  const res = await app.inject({ method: "GET", url: "/v1/billing/summary", headers: routeTestHeaders() });
  assert.equal(res.statusCode, 200);
  const body = res.json() as BillingSummaryResponse;
  assert.equal(body.stripe_billing_available, true);
  assert.equal(body.billing_portal_available, false);
  assert.equal(body.subscription_checkout_available, false);
  assert.ok(body.subscription);
  assert.equal(body.subscription!.plan, "starter");
  assert.equal(body.subscription!.status, "trialing");
  const raw = res.body.toLowerCase();
  assert.ok(!raw.includes("cus_"));
  assert.ok(!raw.includes("sub_"));
});

test("GET /v1/billing/summary allows null subscription", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setGetBillingSummaryTestDelegate(async () => ({
    stripe_billing_available: false,
    billing_portal_available: false,
    subscription_checkout_available: false,
    subscription: null,
  }));

  const res = await app.inject({ method: "GET", url: "/v1/billing/summary", headers: routeTestHeaders() });
  assert.equal(res.statusCode, 200);
  const body = res.json() as BillingSummaryResponse;
  assert.equal(body.subscription, null);
});

test("GET /v1/billing/summary returns 500 with request_id when summary fails", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setGetBillingSummaryTestDelegate(async () => {
    throw new Error("billing_summary_failed");
  });

  const res = await app.inject({ method: "GET", url: "/v1/billing/summary", headers: routeTestHeaders() });
  assert.equal(res.statusCode, 500);
  const j = res.json() as { error: string; request_id?: string };
  assert.equal(j.error, "billing_summary_failed");
  assert.ok(j.request_id);
});
