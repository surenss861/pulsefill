import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { setBuildRecoveryHealthTestDelegate, type RecoveryHealthResponse } from "./recovery-health.js";

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setBuildRecoveryHealthTestDelegate(null);
});

const EVAL_AT = "2026-04-30T18:00:00.000Z";

function baseSignals(overrides: Partial<RecoveryHealthResponse["signals"]> = {}): RecoveryHealthResponse["signals"] {
  const defaults: RecoveryHealthResponse["signals"] = {
    setup: {
      status: "ready",
      label: "Workspace setup",
      value: "Ready",
      details: "Locations, providers, and services are configured.",
    },
    standby_pool: {
      status: "ready",
      label: "Standby pool",
      value: "12 active",
      details: "Customers with active standby preferences.",
    },
    notification_reach: {
      status: "ready",
      label: "Notification reach",
      value: "9 reachable",
      details: "Customers with active standby and a reachable push or contact channel.",
    },
    recent_matching: {
      status: "ready",
      label: "Recent matching",
      value: "4 offers sent",
      details: "Recent openings are reaching matched customers.",
    },
    claims: {
      status: "ready",
      label: "Claims",
      value: "0 waiting",
      details: "No claims waiting for confirmation.",
    },
  };
  return { ...defaults, ...overrides };
}

test("GET /v1/businesses/mine/recovery-health returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({ method: "GET", url: "/v1/businesses/mine/recovery-health" });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/businesses/mine/recovery-health returns setup_required (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildRecoveryHealthTestDelegate(async () => ({
    evaluated_at: EVAL_AT,
    status: "setup_required",
    headline: "Workspace setup required",
    message: "Add locations, providers, and services.",
    signals: baseSignals({
      setup: {
        status: "setup_required",
        label: "Workspace setup",
        value: "Needs setup",
        details: "Add at least one active location, provider, and service.",
      },
    }),
    next_actions: [{ label: "Add a location", href: "/locations", priority: "primary" }],
  }));

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/recovery-health",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as RecoveryHealthResponse;
  assert.equal(body.status, "setup_required");
  assert.equal(body.signals.setup.status, "setup_required");
});

test("GET /v1/businesses/mine/recovery-health returns low_coverage standby (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildRecoveryHealthTestDelegate(async () => ({
    evaluated_at: EVAL_AT,
    status: "low_coverage",
    headline: "Low standby coverage",
    message: "Invite more customers.",
    signals: baseSignals({
      standby_pool: {
        status: "low_coverage",
        label: "Standby pool",
        value: "0 active",
        details: "No customers have active standby preferences.",
      },
    }),
    next_actions: [{ label: "Invite customers", href: "/customers", priority: "primary" }],
  }));

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/recovery-health",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  assert.equal((res.json() as RecoveryHealthResponse).status, "low_coverage");
});

test("GET /v1/businesses/mine/recovery-health returns needs_attention (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildRecoveryHealthTestDelegate(async () => ({
    evaluated_at: EVAL_AT,
    status: "needs_attention",
    headline: "Recovery needs attention",
    message: "Review confirmations.",
    signals: baseSignals({
      claims: {
        status: "needs_attention",
        label: "Claims",
        value: "2 waiting",
        details: "Claims waiting for clinic confirmation.",
      },
    }),
    next_actions: [{ label: "Review claims", href: "/claims", priority: "secondary" }],
  }));

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/recovery-health",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  assert.equal((res.json() as RecoveryHealthResponse).status, "needs_attention");
});

test("GET /v1/businesses/mine/recovery-health returns ready (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildRecoveryHealthTestDelegate(async () => ({
    evaluated_at: EVAL_AT,
    status: "ready",
    headline: "Recovery system ready",
    message: "All signals look healthy.",
    signals: baseSignals(),
    next_actions: [],
  }));

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/recovery-health",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as RecoveryHealthResponse;
  assert.equal(body.status, "ready");
  assert.ok(body.evaluated_at);
  assert.ok(body.signals.setup);
  assert.ok(body.signals.standby_pool);
  assert.ok(body.signals.notification_reach);
  assert.ok(body.signals.recent_matching);
  assert.ok(body.signals.claims);
  assert.ok(Array.isArray(body.next_actions));
});

test("GET /v1/businesses/mine/recovery-health returns 500 with request_id when delegate throws", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildRecoveryHealthTestDelegate(async () => {
    throw new Error("boom");
  });

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/recovery-health",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 500);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "recovery_health_failed");
  assert.ok(body.request_id && typeof body.request_id === "string");
});
