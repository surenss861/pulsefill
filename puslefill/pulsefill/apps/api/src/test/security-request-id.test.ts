import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../app.js";
import { createTestEnv } from "./helpers/env.js";

let app: FastifyInstance;

before(async () => {
  app = await buildApp(createTestEnv());
});

after(async () => {
  await app.close();
});

test("GET /health echoes X-Request-Id and sets request_id on 404 JSON errors", async () => {
  const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
  const res = await app.inject({
    method: "GET",
    url: "/health",
    headers: { "x-request-id": id },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["x-request-id"], id);
});

test("GET unknown path returns structured 404 with request_id", async () => {
  const res = await app.inject({ method: "GET", url: "/this-route-does-not-exist-xyz" });
  assert.equal(res.statusCode, 404);
  const rid = res.headers["x-request-id"];
  assert.ok(typeof rid === "string" && rid.length > 0);
});

test("401 from requireAuth includes message and request_id", async () => {
  const res = await app.inject({
    method: "GET",
    url: "/v1/open-slots",
    headers: { "x-pulsefill-route-test": "1" },
  });
  assert.equal(res.statusCode, 401);
  const body = res.json() as { error: string; message?: string; request_id?: string };
  assert.equal(body.error, "unauthorized");
  assert.ok(body.message);
  assert.ok(body.request_id);
  assert.equal(res.headers["x-request-id"], body.request_id);
});
