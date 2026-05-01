import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { setBuildOutcomesPageTestDelegate } from "./businesses.routes.js";
import type { OutcomesPagePayload } from "./outcomes-page.js";

let app: FastifyInstance;

const SAMPLE_OUTCOMES: OutcomesPagePayload = {
  windowLabel: "Today - Apr 25, 2026",
  scorecards: {
    recoveredBookings: 3,
    recoveredRevenue: "$450",
    recoveryRate: "60%",
    expiredUnfilled: 1,
    deliveryFailures: 2,
  },
  outcomeMix: [
    { label: "Recovered", value: 3, emphasis: "primary" },
    { label: "Delivery failures", value: 2, emphasis: "danger" },
  ],
  leaks: [
    {
      title: "Delivery failures",
      value: 2,
      body: "Notification failures reduced recovery reach.",
      href: "/action-queue?section=needs_action",
      cta: "Review queue",
      emphasis: "danger",
    },
  ],
  performanceRows: [{ label: "Downtown", recovered: 2, lost: 1, rate: "67%" }],
  recentRecovered: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Dental cleaning",
      detail: "Downtown - Fri, Apr 25 - 9:00 AM",
      outcome: "Recovered",
      href: "/open-slots/11111111-1111-4111-8111-111111111111?from=outcomes",
    },
  ],
  recentLost: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Consultation",
      detail: "Yorkville - Fri, Apr 25 - 1:00 PM",
      outcome: "Expired unfilled",
      href: "/open-slots/22222222-2222-4222-8222-222222222222?from=outcomes",
    },
  ],
};

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setBuildOutcomesPageTestDelegate(null);
});

test("GET /v1/businesses/mine/outcomes returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/outcomes",
  });

  assert.equal(res.statusCode, 401);
  assert.equal((res.json() as { error: string }).error, "unauthorized");
});

test("GET /v1/businesses/mine/outcomes returns stable payload shape", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildOutcomesPageTestDelegate(async () => SAMPLE_OUTCOMES);

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/outcomes",
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as OutcomesPagePayload;

  assert.equal(typeof body.windowLabel, "string");
  assert.equal(typeof body.scorecards.recoveredBookings, "number");
  assert.equal(typeof body.scorecards.recoveredRevenue, "string");
  assert.equal(typeof body.scorecards.recoveryRate, "string");
  assert.ok(Array.isArray(body.outcomeMix));
  assert.ok(Array.isArray(body.leaks));
  assert.ok(Array.isArray(body.performanceRows));
  assert.ok(Array.isArray(body.recentRecovered));
  assert.ok(Array.isArray(body.recentLost));

  assert.deepEqual(body, SAMPLE_OUTCOMES);
});

test("GET /v1/businesses/mine/outcomes supports empty-state arrays and zeroes", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildOutcomesPageTestDelegate(async () => ({
    windowLabel: "Today - Apr 25, 2026",
    scorecards: {
      recoveredBookings: 0,
      recoveredRevenue: "$0",
      recoveryRate: "0%",
      expiredUnfilled: 0,
      deliveryFailures: 0,
    },
    outcomeMix: [],
    leaks: [],
    performanceRows: [],
    recentRecovered: [],
    recentLost: [],
  }));

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/outcomes",
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as OutcomesPagePayload;
  assert.equal(body.scorecards.recoveredBookings, 0);
  assert.equal(body.scorecards.recoveryRate, "0%");
  assert.equal(body.outcomeMix.length, 0);
  assert.equal(body.recentRecovered.length, 0);
  assert.equal(body.recentLost.length, 0);
});

test("GET /v1/businesses/mine/outcomes returns standardized 500 error when builder fails", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildOutcomesPageTestDelegate(async () => {
    throw new Error("boom");
  });

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/outcomes",
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 500);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "outcomes_page_failed");
  assert.ok(body.request_id && typeof body.request_id === "string");
});
