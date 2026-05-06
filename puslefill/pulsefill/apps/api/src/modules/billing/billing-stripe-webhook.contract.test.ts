import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";
import Stripe from "stripe";

import { buildApp } from "../../app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import type { Env } from "../../config/env.js";
import { setStripeVerifiedWebhookDelegateForTest } from "./billing-stripe-webhook.js";

let app: FastifyInstance;

const WEBHOOK_SECRET = "whsec_test_secret_for_contract_tests";

function webhookEnv(): Env {
  return {
    ...createTestEnv(),
    ENABLE_STRIPE_WEBHOOK_ROUTES: true,
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  };
}

function minimalSignedEvent(type: string): { raw: Buffer; signature: string } {
  const stripe = new Stripe("sk_test_placeholder", { apiVersion: "2025-02-24.acacia", typescript: true });
  const payload = {
    id: "evt_test_webhook_contract",
    object: "event",
    api_version: "2025-02-24.acacia",
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 0,
    request: null,
    data: {
      object: {
        id: "sub_test",
        object: "subscription",
        metadata: {},
      },
    },
  };
  const payloadString = JSON.stringify(payload);
  const raw = Buffer.from(payloadString, "utf8");
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: WEBHOOK_SECRET,
  });
  return { raw, signature };
}

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(webhookEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setStripeVerifiedWebhookDelegateForTest(null);
});

test("POST /v1/webhooks/stripe returns 400 without stripe-signature", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const { raw } = minimalSignedEvent("customer.subscription.updated");
  const res = await app.inject({
    method: "POST",
    url: "/v1/webhooks/stripe",
    headers: { "content-type": "application/json" },
    payload: raw,
  });
  assert.equal(res.statusCode, 400);
  const j = res.json() as { error: string };
  assert.equal(j.error, "stripe_webhook_missing_signature");
});

test("POST /v1/webhooks/stripe returns 400 when signature is invalid", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const { raw } = minimalSignedEvent("customer.subscription.updated");
  const res = await app.inject({
    method: "POST",
    url: "/v1/webhooks/stripe",
    headers: {
      "content-type": "application/json",
      "stripe-signature": "t=1,v1=deadbeef",
    },
    payload: raw,
  });
  assert.equal(res.statusCode, 400);
  const j = res.json() as { error: string };
  assert.equal(j.error, "stripe_webhook_invalid_signature");
});

test("POST /v1/webhooks/stripe accepts a verified event and runs handler", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  let sawType: string | null = null;
  setStripeVerifiedWebhookDelegateForTest(async (event) => {
    sawType = event.type;
  });

  const { raw, signature } = minimalSignedEvent("customer.subscription.updated");
  const res = await app.inject({
    method: "POST",
    url: "/v1/webhooks/stripe",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    payload: raw,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(sawType, "customer.subscription.updated");
  const j = res.json() as { received?: boolean };
  assert.equal(j.received, true);
});
