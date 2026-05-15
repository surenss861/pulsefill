import assert from "node:assert/strict";
import { test } from "node:test";

import { buildApp } from "../app.js";
import { assertProductionStartup } from "../config/production-readiness.js";
import { createTestEnv } from "../test/helpers/env.js";

test("GET /health returns ok, metadata, and x-request-id", async () => {
  const app = await buildApp(createTestEnv());
  const res = await app.inject({ method: "GET", url: "/health" });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body) as Record<string, unknown>;
  assert.equal(body.ok, true);
  assert.equal(body.service, "@pulsefill/api");
  assert.equal(typeof body.version, "string");
  assert.equal(body.node_env, "test");
  assert.equal(body.supabase_host, "127.0.0.1:54321");
  assert.ok(res.headers["x-request-id"]);
  await app.close();
});

test("GET /ready includes database check and service surface", async () => {
  const app = await buildApp(createTestEnv());
  const res = await app.inject({ method: "GET", url: "/ready" });
  assert.ok(res.statusCode === 200 || res.statusCode === 503, `unexpected ${res.statusCode}`);
  const body = JSON.parse(res.body) as Record<string, unknown>;
  assert.ok("checks" in body && typeof body.checks === "object");
  assert.equal(body.service, "@pulsefill/api");
  assert.ok(res.headers["x-request-id"]);
  await app.close();
});

test("assertProductionStartup throws when production CORS missing", () => {
  assert.throws(
    () =>
      assertProductionStartup({
        ...createTestEnv(),
        NODE_ENV: "production",
        SUPABASE_URL: "https://test.supabase.co",
        API_CORS_ORIGINS: undefined,
      }),
    /API_CORS_ORIGINS/,
  );
});

test("assertProductionStartup throws when production Supabase is not https", () => {
  assert.throws(
    () =>
      assertProductionStartup({
        ...createTestEnv(),
        NODE_ENV: "production",
        SUPABASE_URL: "http://127.0.0.1:54321",
        API_CORS_ORIGINS: ["https://app.example.com"],
      }),
    /https/,
  );
});

test("assertProductionStartup passes when production CORS and https Supabase set", () => {
  assert.doesNotThrow(() =>
    assertProductionStartup({
      ...createTestEnv(),
      NODE_ENV: "production",
      SUPABASE_URL: "https://test.supabase.co",
      API_CORS_ORIGINS: ["https://app.example.com"],
    }),
  );
});
