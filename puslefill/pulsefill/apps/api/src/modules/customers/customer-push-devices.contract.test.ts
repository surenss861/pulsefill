import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import {
  resetCustomerPushDeviceTestDelegates,
  setDeactivatePushDeviceTestDelegate,
  setRegisterPushDeviceTestDelegate,
} from "./customers.routes.js";

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  resetCustomerPushDeviceTestDelegates();
});

test("POST /v1/customers/me/push-devices returns 401 when unauthenticated", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices",
    headers: { "content-type": "application/json" },
    payload: { device_token: "token_1234567890", platform: "ios" },
  });
  assert.equal(res.statusCode, 401);
  assert.equal((res.json() as { error: string }).error, "unauthorized");
});

test("POST /v1/customers/me/push-devices registers with default token_type apns", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  setRegisterPushDeviceTestDelegate(async ({ customerId, body }) => {
    assert.equal(customerId, process.env.PULSEFILL_TEST_CUSTOMER_ID);
    assert.equal(body.token_type, "apns");
    assert.equal(body.replace_existing, true);
    return {
      id: "device_1",
      token_type: body.token_type,
      replace_existing: body.replace_existing,
      last_seen_at: "2026-04-25T15:00:00.000Z",
    };
  });

  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: { device_token: "token_1234567890", platform: "ios" },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), {
    registered: true,
    id: "device_1",
    token_type: "apns",
    replaced_existing: true,
    last_seen_at: "2026-04-25T15:00:00.000Z",
  });
});

test("POST /v1/customers/me/push-devices registers explicit expo token and no replace", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  setRegisterPushDeviceTestDelegate(async ({ body }) => {
    assert.equal(body.token_type, "expo");
    assert.equal(body.replace_existing, false);
    return {
      id: "device_2",
      token_type: "expo",
      replace_existing: false,
      last_seen_at: "2026-04-25T15:01:00.000Z",
    };
  });

  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: {
      device_token: "ExponentPushToken[abcdef123456]",
      platform: "ios",
      token_type: "expo",
      replace_existing: false,
    },
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as Record<string, unknown>;
  assert.equal(body.token_type, "expo");
  assert.equal(body.replaced_existing, false);
  assert.equal(typeof body.last_seen_at, "string");
});

test("POST /v1/customers/me/push-devices returns 400 for invalid token_type", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: { device_token: "token_1234567890", platform: "ios", token_type: "bad" },
  });
  assert.equal(res.statusCode, 400);
});

test("POST /v1/customers/me/push-devices returns 400 when device_token missing", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: { platform: "ios" },
  });
  assert.equal(res.statusCode, 400);
});

test("POST /v1/customers/me/push-devices/deactivate returns 401 when unauthenticated", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices/deactivate",
    headers: { "content-type": "application/json" },
    payload: { device_token: "token_1234567890" },
  });
  assert.equal(res.statusCode, 401);
  assert.equal((res.json() as { error: string }).error, "unauthorized");
});

test("POST /v1/customers/me/push-devices/deactivate returns 400 when device_token missing", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices/deactivate",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: {},
  });
  assert.equal(res.statusCode, 400);
});

test("POST /v1/customers/me/push-devices/deactivate honors platform/token_type filters", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  setDeactivatePushDeviceTestDelegate(async ({ customerId, body }) => {
    assert.equal(customerId, process.env.PULSEFILL_TEST_CUSTOMER_ID);
    assert.equal(body.device_token, "token_1234567890");
    assert.equal(body.platform, "ios");
    assert.equal(body.token_type, "apns");
    return { deactivated: true, device_token: body.device_token };
  });

  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices/deactivate",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: { device_token: "token_1234567890", platform: "ios", token_type: "apns" },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { deactivated: true, device_token: "token_1234567890" });
});

test("POST /v1/customers/me/push-devices/deactivate non-existing token remains safe", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  setDeactivatePushDeviceTestDelegate(async ({ body }) => {
    return { deactivated: true, device_token: body.device_token };
  });

  const res = await app.inject({
    method: "POST",
    url: "/v1/customers/me/push-devices/deactivate",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: { device_token: "token_does_not_exist" },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { deactivated: true, device_token: "token_does_not_exist" });
});
