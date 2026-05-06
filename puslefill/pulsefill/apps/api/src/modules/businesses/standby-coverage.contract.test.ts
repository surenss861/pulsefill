import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { setBuildStandbyCoverageTestDelegate } from "./standby-coverage.js";

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setBuildStandbyCoverageTestDelegate(null);
});

test("GET /v1/businesses/mine/standby-coverage returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({ method: "GET", url: "/v1/businesses/mine/standby-coverage" });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/businesses/mine/standby-coverage returns stable payload shape", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildStandbyCoverageTestDelegate(async () => ({
    evaluated_at: "2026-04-30T12:00:00.000Z",
    active_preferences_count: 4,
    standby_customer_count: 3,
    eligible_customer_count: 2,
    reachable_customer_count: 1,
    unreachable_eligible_count: 1,
    customers_pending_membership: 1,
    services: [
      { service_id: "11111111-1111-4111-8111-111111111111", service_name: "Cleaning", watching_customer_count: 2 },
    ],
    uncovered_services: [],
    thin_services: [
      { service_id: "22222222-2222-4222-8222-222222222222", service_name: "Consult", watching_customer_count: 1 },
    ],
    recent_activity: [
      {
        updated_at: "2026-04-29T10:00:00.000Z",
        active: true,
        customer_display: "Alex",
        service_label: "Cleaning",
        location_label: "Main",
      },
    ],
  }));

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/standby-coverage",
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as {
    eligible_customer_count: number;
    services: unknown[];
    recent_activity: Array<{ customer_display: string }>;
  };
  assert.equal(body.eligible_customer_count, 2);
  assert.equal(body.services.length, 1);
  assert.equal(body.recent_activity[0]?.customer_display, "Alex");
});
