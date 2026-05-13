import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { createTestEnv } from "../../test/helpers/env.js";

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

const LIST_PATHS = [
  "/v1/businesses/mine/customer-standby-requests",
  "/v1/businesses/mine/standby-requests",
] as const;

const SAMPLE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-111111111111";

for (const path of LIST_PATHS) {
  test(`GET ${path} returns 401 without auth`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;
    const res = await app.inject({ method: "GET", url: `${path}?status=pending` });
    assert.equal(res.statusCode, 401);
  });
}

for (const path of LIST_PATHS) {
  test(`POST ${path}/:id/approve returns 401 without auth`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;
    const res = await app.inject({
      method: "POST",
      url: `${path}/${SAMPLE_ID}/approve`,
      headers: { "content-type": "application/json" },
      payload: "{}",
    });
    assert.equal(res.statusCode, 401);
  });

  test(`POST ${path}/:id/decline returns 401 without auth`, async () => {
    if (process.env.PULSEFILL_API_TEST !== "1") return;
    const res = await app.inject({
      method: "POST",
      url: `${path}/${SAMPLE_ID}/decline`,
      headers: { "content-type": "application/json" },
      payload: "{}",
    });
    assert.equal(res.statusCode, 401);
  });
}
