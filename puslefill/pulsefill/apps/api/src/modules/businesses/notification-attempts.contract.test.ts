import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { setListNotificationAttemptsTestDelegate } from "./businesses.routes.js";

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setListNotificationAttemptsTestDelegate(null);
});

test("GET /v1/businesses/mine/notification-attempts returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/notification-attempts",
  });
  assert.equal(res.statusCode, 401);
  assert.equal((res.json() as { error: string }).error, "unauthorized");
});

test("GET /v1/businesses/mine/notification-attempts returns items list", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  setListNotificationAttemptsTestDelegate(async ({ businessId, filters }) => {
    assert.equal(businessId, process.env.PULSEFILL_TEST_BUSINESS_ID);
    assert.equal(filters.status, "suppressed");
    assert.equal(filters.type, "customer_offer_sent");
    assert.equal(filters.limit, 10);
    return {
      items: [
        {
          id: "attempt_1",
          type: "customer_offer_sent",
          status: "suppressed",
          decision: "suppress",
          suppression_reason: "quiet_hours",
          retryable: true,
          dedupe_key: "customer_offer_sent:offer_1",
          open_slot_id: "11111111-1111-4111-8111-111111111111",
          customer_id: "22222222-2222-4222-8222-222222222222",
          claim_id: null,
          provider: null,
          error_code: null,
          error_message: null,
          created_at: "2026-04-25T16:00:00.000Z",
          updated_at: "2026-04-25T16:00:00.000Z",
        },
      ],
    };
  });

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/notification-attempts?status=suppressed&type=customer_offer_sent&limit=10",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as { items: Array<Record<string, unknown>> };
  assert.ok(Array.isArray(body.items));
  assert.equal(body.items[0]?.status, "suppressed");
  assert.equal(body.items[0]?.suppression_reason, "quiet_hours");
});

test("GET /v1/businesses/mine/notification-attempts returns 500 on failure", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  setListNotificationAttemptsTestDelegate(async () => {
    throw new Error("boom");
  });
  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/notification-attempts",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.json(), { error: "notification_attempts_failed" });
});
