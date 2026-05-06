import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import type { CustomerTimelineResponse } from "./customer-timeline.js";
import {
  CUSTOMER_TIMELINE_PREVIEW_MAX,
  previewNoteBodyForTimeline,
  setBuildCustomerTimelineTestDelegate,
} from "./customer-timeline.js";

let app: FastifyInstance;

const CUSTOMER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-111111111111";

const NOTE_ID = "eeeeeeee-bbbb-4ccc-8ddd-555555555555";
const LONG_PREVIEW = `${"x".repeat(200)}`;

const SAMPLE_UNSORTED: CustomerTimelineResponse = {
  customer_id: CUSTOMER_ID,
  items: [
    {
      id: "claim:c1:submitted",
      kind: "claim_submitted",
      title: "Claim sent",
      description: "Customer claimed an opening.",
      occurred_at: "2026-01-05T10:00:00.000Z",
      source: "claim",
      severity: "info",
      metadata: { claim_id: "c1" },
    },
    {
      id: `note:${NOTE_ID}:follow_done`,
      kind: "follow_up_completed",
      title: "Follow-up completed",
      description: "Staff completed a follow-up.",
      occurred_at: "2026-01-20T15:00:00.000Z",
      source: "note",
      severity: "success",
      metadata: { note_id: NOTE_ID, preview: LONG_PREVIEW },
    },
    {
      id: `note:${NOTE_ID}:added`,
      kind: "internal_note_added",
      title: "Internal note added",
      description: "A staff note was added for this customer.",
      occurred_at: "2026-01-18T12:00:00.000Z",
      source: "note",
      severity: "muted",
      metadata: { note_id: NOTE_ID, preview: "Short" },
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
  setBuildCustomerTimelineTestDelegate(null);
});

test("previewNoteBodyForTimeline truncates long note bodies", () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const out = previewNoteBodyForTimeline(`${"word ".repeat(80)}`);
  assert.ok(out.endsWith("…"));
  assert.ok(out.length <= CUSTOMER_TIMELINE_PREVIEW_MAX);
});

test("GET /v1/businesses/mine/customers/:id/timeline returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/timeline`,
  });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/businesses/mine/customers/:id/timeline returns 400 for invalid id", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/customers/not-a-uuid/timeline",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 400);
  assert.equal((res.json() as { error: string }).error, "invalid_customer_id");
});

test("GET /v1/businesses/mine/customers/:id/timeline returns 404 when not in business context", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildCustomerTimelineTestDelegate(async () => {
    throw new Error("customer_timeline_not_found");
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/timeline`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 404);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "not_found");
  assert.ok(body.request_id);
});

test("GET /v1/businesses/mine/customers/:id/timeline returns 500 when delegate throws", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildCustomerTimelineTestDelegate(async () => {
    throw new Error("boom");
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/timeline`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 500);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "customer_timeline_failed");
  assert.ok(body.request_id);
});

test("GET /v1/businesses/mine/customers/:id/timeline returns stable shape, sorts newest first, no token leakage", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setBuildCustomerTimelineTestDelegate(async () => SAMPLE_UNSORTED);

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/timeline`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as CustomerTimelineResponse;
  assert.equal(body.customer_id, CUSTOMER_ID);
  assert.ok(Array.isArray(body.items));
  assert.equal(body.items.length, 3);
  assert.equal(body.items[0]!.occurred_at, "2026-01-20T15:00:00.000Z");
  assert.equal(body.items[1]!.occurred_at, "2026-01-18T12:00:00.000Z");
  assert.equal(body.items[2]!.occurred_at, "2026-01-05T10:00:00.000Z");

  const itemKeys = [
    "description",
    "id",
    "kind",
    "metadata",
    "occurred_at",
    "severity",
    "source",
    "title",
  ].sort();
  for (const it of body.items) {
    assert.deepEqual(Object.keys(it).sort(), itemKeys);
    assert.ok(typeof it.metadata === "object" && it.metadata !== null);
    for (const v of Object.values(it.metadata)) {
      assert.equal(typeof v, "string");
    }
  }

  const raw = res.body;
  assert.ok(!raw.includes("device_token"));
  assert.ok(!raw.toLowerCase().includes("apns"));
});
