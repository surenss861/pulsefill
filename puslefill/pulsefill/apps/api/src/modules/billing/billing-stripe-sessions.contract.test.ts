import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import type { Env } from "../../config/env.js";
import {
  resetBillingStripeSessionTestDelegates,
  setBillingCheckoutSessionDelegateForTest,
  setBillingPortalSessionDelegateForTest,
} from "./billing-stripe-sessions.js";

let app: FastifyInstance;

function billingEnv(overrides: Partial<Env> = {}): Env {
  return {
    ...createTestEnv(),
    ENABLE_BILLING_ROUTES: true,
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_SUBSCRIPTION_PRICE_ID: "price_test_placeholder",
    DASHBOARD_URL: "https://dash.example.test",
    ...overrides,
  };
}

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(billingEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  resetBillingStripeSessionTestDelegates();
});

test("POST /v1/billing/checkout returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({ method: "POST", url: "/v1/billing/checkout" });
  assert.equal(res.statusCode, 401);
});

test("POST /v1/billing/portal returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({ method: "POST", url: "/v1/billing/portal" });
  assert.equal(res.statusCode, 401);
});

test("POST /v1/billing/checkout is absent when ENABLE_BILLING_ROUTES is false", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const gated = await buildApp(createTestEnv());
  try {
    const res = await gated.inject({
      method: "POST",
      url: "/v1/billing/checkout",
      headers: routeTestHeaders(),
    });
    assert.equal(res.statusCode, 404);
  } finally {
    await gated.close();
  }
});

test("POST /v1/billing/checkout returns 503 when Stripe price or dashboard URL missing", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const a = await buildApp(
    billingEnv({
      STRIPE_SUBSCRIPTION_PRICE_ID: undefined,
      DASHBOARD_URL: "https://dash.example.test",
    }),
  );
  try {
    const res = await a.inject({ method: "POST", url: "/v1/billing/checkout", headers: routeTestHeaders() });
    assert.equal(res.statusCode, 503);
    const j = res.json() as { error: string };
    assert.equal(j.error, "billing_checkout_unconfigured");
  } finally {
    await a.close();
  }
});

test("POST /v1/billing/checkout returns url-only body when session succeeds", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBillingCheckoutSessionDelegateForTest(async () => ({ url: "https://checkout.stripe.com/test-session" }));

  const res = await app.inject({
    method: "POST",
    url: "/v1/billing/checkout",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  const j = res.json() as { url?: string; cus_?: unknown };
  assert.equal(j.url, "https://checkout.stripe.com/test-session");
  assert.equal(Object.keys(j).length, 1);
  const raw = res.body.toLowerCase();
  assert.ok(!raw.includes("cus_"));
  assert.ok(!raw.includes("sub_"));
});

test("POST /v1/billing/portal returns 400 when no Stripe customer is linked", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBillingPortalSessionDelegateForTest(async () => {
    throw new Error("billing_portal_missing_customer");
  });

  const res = await app.inject({
    method: "POST",
    url: "/v1/billing/portal",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 400);
  const j = res.json() as { error: string; message?: string };
  assert.equal(j.error, "billing_portal_no_customer");
  assert.ok(j.message?.includes("couldn't open billing") || j.message?.includes("We couldn't open billing"));
});

test("POST /v1/billing/portal returns url-only body when session succeeds", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBillingPortalSessionDelegateForTest(async () => ({ url: "https://billing.stripe.com/test-portal" }));

  const res = await app.inject({
    method: "POST",
    url: "/v1/billing/portal",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  const j = res.json() as { url?: string };
  assert.equal(j.url, "https://billing.stripe.com/test-portal");
  assert.equal(Object.keys(j).length, 1);
});
