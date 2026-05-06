import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { setBuildRecoveryInsightsTestDelegate } from "./businesses.routes.js";
import type { RecoveryInsightsResponse } from "./recovery-insights.js";

let app: FastifyInstance;

const SAMPLE: RecoveryInsightsResponse = {
  period: { days: 30, label: "Last 30 days", start_at: "2026-03-01T00:00:00.000Z", end_at: "2026-03-31T23:59:59.000Z" },
  recovered_count_30d: 12,
  missed_count_30d: 4,
  no_match_count_30d: 18,
  top_no_match_reasons: [
    { reason: "no_matching_standby_customers", count: 10, label: "No preferences matched this opening" },
    { reason: "no_active_preferences", count: 5, label: "No active standby preferences" },
  ],
  thin_services: [
    { service_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", service_name: "Cleaning", no_match_count: 7, recovered_bookings_30d: 1 },
  ],
  delivery_failure_count_30d: 2,
  average_claim_confirmation_minutes: 42.5,
  suggested_focus: {
    key: "service_coverage",
    headline: "Align coverage for “Cleaning”",
    detail: "7 no-matches vs 1 recovered bookings on this service in the window.",
    href: "/services",
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
  setBuildRecoveryInsightsTestDelegate(null);
});

test("GET /v1/businesses/mine/recovery-insights returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({ method: "GET", url: "/v1/businesses/mine/recovery-insights" });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/businesses/mine/recovery-insights returns stable payload shape", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildRecoveryInsightsTestDelegate(async () => SAMPLE);

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/recovery-insights",
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as RecoveryInsightsResponse;
  assert.equal(body.period.days, 30);
  assert.equal(typeof body.recovered_count_30d, "number");
  assert.equal(typeof body.missed_count_30d, "number");
  assert.equal(typeof body.no_match_count_30d, "number");
  assert.ok(Array.isArray(body.top_no_match_reasons));
  assert.ok(Array.isArray(body.thin_services));
  assert.equal(typeof body.delivery_failure_count_30d, "number");
  assert.ok(body.average_claim_confirmation_minutes === null || typeof body.average_claim_confirmation_minutes === "number");
  assert.equal(typeof body.suggested_focus.headline, "string");
  assert.equal(typeof body.suggested_focus.href, "string");
  assert.ok(body.suggested_focus.href.startsWith("/"));
  assert.deepEqual(body, SAMPLE);
});

test("GET /v1/businesses/mine/recovery-insights returns 500 when delegate throws", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildRecoveryInsightsTestDelegate(async () => {
    throw new Error("boom");
  });

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/recovery-insights",
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 500);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "recovery_insights_failed");
  assert.ok(body.request_id && typeof body.request_id === "string");
});
