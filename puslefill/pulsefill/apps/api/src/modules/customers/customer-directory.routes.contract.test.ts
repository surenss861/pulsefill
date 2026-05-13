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

test("GET /v1/directory/businesses returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  const res = await app.inject({ method: "GET", url: "/v1/directory/businesses" });
  assert.equal(res.statusCode, 401);
});
