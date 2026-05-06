import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import {
  buildRetryGuidance,
  guidanceFromRetry,
  setBuildNoMatchExplanationTestDelegate,
} from "./no-match-explanation.js";

const SLOT_ID = "11111111-1111-4111-8111-111111111111";

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setBuildNoMatchExplanationTestDelegate(null);
});

test("GET /v1/open-slots/:id/no-match-explanation returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}/no-match-explanation`,
  });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/open-slots/:id/no-match-explanation returns 404 for missing slot (no delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}/no-match-explanation`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 404);
});

test("GET /v1/open-slots/:id/no-match-explanation returns payload without customer identifiers", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const rejection_breakdown = [
    { reason: "service_mismatch", count: 3, label: "Service did not match" },
    { reason: "outside_availability_days", count: 2, label: "Day did not match availability" },
  ] as const;
  const retry_guidance = buildRetryGuidance(SLOT_ID, "no_matching_standby_customers", [...rejection_breakdown], true);

  setBuildNoMatchExplanationTestDelegate(async () => ({
    open_slot_id: SLOT_ID,
    has_explanation: true,
    source_observed_at: "2026-04-30T12:00:00.000Z",
    reason: "no_matching_standby_customers",
    headline: "No preferences matched this opening",
    explanation: "Checked preferences; none matched.",
    summary: {
      total_preferences_checked: 8,
      matched: 0,
      rejected: { service_mismatch: 3, outside_availability_days: 2 },
    },
    rejection_breakdown: [...rejection_breakdown],
    guidance: guidanceFromRetry(retry_guidance),
    retry_guidance,
  }));

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}/no-match-explanation`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const raw = res.body;
  assert.ok(!raw.includes("customer_id"));
  assert.ok(!raw.includes("preference_id"));
  const body = res.json() as {
    rejection_breakdown: unknown[];
    summary: { total_preferences_checked: number };
    retry_guidance: { headline: string; recommended_actions: { href: string; priority: string }[] };
  };
  assert.equal(body.summary.total_preferences_checked, 8);
  assert.equal(body.rejection_breakdown.length, 2);
  assert.equal(body.retry_guidance.headline, "Service coverage is thin");
  assert.ok(body.retry_guidance.recommended_actions.some((a) => a.href.startsWith("/customers")));
  assert.equal(body.retry_guidance.recommended_actions.filter((a) => a.priority === "primary").length, 1);
});

test("GET /v1/open-slots/:id/no-match-explanation supports empty-state shape", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const retry_guidance = buildRetryGuidance(SLOT_ID, null, [], false);

  setBuildNoMatchExplanationTestDelegate(async () => ({
    open_slot_id: SLOT_ID,
    has_explanation: false,
    source_observed_at: null,
    reason: null,
    headline: "No recent no-match diagnostics",
    explanation: "No recorded run yet.",
    summary: null,
    rejection_breakdown: [],
    guidance: guidanceFromRetry(retry_guidance),
    retry_guidance,
  }));

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}/no-match-explanation`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as { has_explanation: boolean; retry_guidance: { headline: string } };
  assert.equal(body.has_explanation, false);
  assert.ok(body.retry_guidance.headline.includes("unlock"));
});
