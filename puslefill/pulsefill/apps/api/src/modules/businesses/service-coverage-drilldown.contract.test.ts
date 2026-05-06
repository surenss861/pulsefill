import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { setBuildServiceCoverageDrilldownTestDelegate } from "./businesses.routes.js";
import type { ServiceCoverageDrilldownResponse } from "./service-coverage-drilldown.js";

const SERVICE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

let app: FastifyInstance;

const SAMPLE: ServiceCoverageDrilldownResponse = {
  service_id: SERVICE_ID,
  service_name: "Botox consult",
  period: { days: 30, label: "Last 30 days", start_at: "2026-03-01T00:00:00.000Z", end_at: "2026-03-31T23:59:59.000Z" },
  watching_customer_count: 1,
  reachable_customer_count: 0,
  recent_openings_30d: 4,
  no_match_events_30d: 3,
  top_no_match_reasons: [
    { reason: "notice_window_mismatch", count: 2, label: "Notice window did not match" },
    { reason: "outside_availability_time", count: 1, label: "Time did not match availability" },
  ],
  suggested_action: {
    key: "reachability",
    label: "Review standby reachability",
    href: "/customers",
    priority: "primary",
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
  setBuildServiceCoverageDrilldownTestDelegate(null);
});

test("GET /v1/businesses/mine/service-coverage/:serviceId returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/service-coverage/${SERVICE_ID}`,
  });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/businesses/mine/service-coverage/:serviceId returns stable payload shape", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildServiceCoverageDrilldownTestDelegate(async () => SAMPLE);

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/service-coverage/${SERVICE_ID}`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as ServiceCoverageDrilldownResponse;
  assert.equal(body.service_id, SERVICE_ID);
  assert.equal(typeof body.watching_customer_count, "number");
  assert.equal(typeof body.reachable_customer_count, "number");
  assert.equal(typeof body.recent_openings_30d, "number");
  assert.equal(typeof body.no_match_events_30d, "number");
  assert.ok(Array.isArray(body.top_no_match_reasons));
  assert.equal(typeof body.suggested_action.label, "string");
  assert.ok(body.suggested_action.href.startsWith("/"));
  assert.deepEqual(body, SAMPLE);
});

test("GET /v1/businesses/mine/service-coverage/:serviceId returns 400 for invalid uuid", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/service-coverage/not-a-uuid",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 400);
  assert.equal((res.json() as { error: string }).error, "invalid_service_id");
});

test("GET /v1/businesses/mine/service-coverage/:serviceId returns 404 when delegate throws not found", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildServiceCoverageDrilldownTestDelegate(async () => {
    throw new Error("service_not_found");
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/service-coverage/${SERVICE_ID}`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 404);
  assert.equal((res.json() as { error: string }).error, "service_not_found");
});
