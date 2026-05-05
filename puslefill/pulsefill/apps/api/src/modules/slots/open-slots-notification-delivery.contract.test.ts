import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import {
  setNotificationDeliveryRouteTestDelegate,
  type NotificationDeliveryResponse,
} from "./open-slot-notification-delivery.js";

const SLOT_IN_BUSINESS = "11111111-1111-4111-8111-111111111111";
const SLOT_OTHER_BUSINESS = "99999999-9999-4999-8999-999999999999";

const ALLOWED_ITEM_KEYS = ["id", "customer_label", "channel", "status", "reason", "created_at", "offer_id"] as const;

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setNotificationDeliveryRouteTestDelegate(null);
});

function sampleDeliveryBody(openSlotId: string): NotificationDeliveryResponse {
  return {
    open_slot_id: openSlotId,
    summary: { sent: 2, failed: 0, skipped: 1, simulated: 0 },
    items: [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        customer_label: "Alex",
        channel: "push",
        status: "sent",
        reason: "unknown",
        created_at: "2026-04-30T14:00:00.000Z",
        offer_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      },
      {
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        customer_label: "Sam",
        channel: "push",
        status: "skipped",
        reason: "push_disabled",
        created_at: "2026-04-30T14:01:00.000Z",
        offer_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      },
    ],
  };
}

test("GET /v1/open-slots/:id/notification-delivery returns 200 with body for staff slot (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const biz = process.env.PULSEFILL_TEST_BUSINESS_ID;
  assert.ok(biz);

  setNotificationDeliveryRouteTestDelegate(async ({ slotId, businessId }) => {
    assert.equal(businessId, biz);
    if (slotId === SLOT_IN_BUSINESS) return { mode: "ok", body: sampleDeliveryBody(slotId) };
    return { mode: "not_found" };
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_IN_BUSINESS}/notification-delivery`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as NotificationDeliveryResponse;
  assert.equal(body.open_slot_id, SLOT_IN_BUSINESS);
  assert.deepEqual(body.summary, { sent: 2, failed: 0, skipped: 1, simulated: 0 });
  assert.equal(body.items.length, 2);
});

test("GET /v1/open-slots/:id/notification-delivery returns 404 for slot outside staff business (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const biz = process.env.PULSEFILL_TEST_BUSINESS_ID;
  assert.ok(biz);

  setNotificationDeliveryRouteTestDelegate(async ({ slotId, businessId }) => {
    assert.equal(businessId, biz);
    if (slotId === SLOT_IN_BUSINESS) return { mode: "ok", body: sampleDeliveryBody(slotId) };
    return { mode: "not_found" };
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_OTHER_BUSINESS}/notification-delivery`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 404);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "not_found");
  assert.ok(body.request_id && typeof body.request_id === "string");
});

test("GET /v1/open-slots/:id/notification-delivery empty logs yield summary zeros (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setNotificationDeliveryRouteTestDelegate(async ({ slotId }) => {
    if (slotId === SLOT_IN_BUSINESS) {
      return {
        mode: "ok",
        body: {
          open_slot_id: slotId,
          summary: { sent: 0, failed: 0, skipped: 0, simulated: 0 },
          items: [],
        },
      };
    }
    return { mode: "not_found" };
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_IN_BUSINESS}/notification-delivery`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as NotificationDeliveryResponse;
  assert.deepEqual(body.summary, { sent: 0, failed: 0, skipped: 0, simulated: 0 });
  assert.equal(body.items.length, 0);
});

test("GET /v1/open-slots/:id/notification-delivery JSON items only expose staff-safe fields (delegate)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setNotificationDeliveryRouteTestDelegate(async ({ slotId }) => {
    if (slotId !== SLOT_IN_BUSINESS) return { mode: "not_found" };
    return {
      mode: "ok",
      body: {
        open_slot_id: slotId,
        summary: { sent: 1, failed: 0, skipped: 0, simulated: 0 },
        items: [
          {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            customer_label: "Pat",
            channel: "push",
            status: "sent",
            reason: "unknown",
            created_at: "2026-04-30T15:00:00.000Z",
            offer_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          },
        ],
      },
    };
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_IN_BUSINESS}/notification-delivery`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const raw = res.payload;
  assert.ok(!raw.toLowerCase().includes("device_token"));
  assert.ok(!raw.includes('"metadata"'));

  const body = JSON.parse(raw) as NotificationDeliveryResponse;
  for (const item of body.items) {
    const keys = Object.keys(item as Record<string, unknown>).sort();
    assert.deepEqual(keys, [...ALLOWED_ITEM_KEYS].sort());
  }
});

test("GET /v1/open-slots/:id/notification-delivery returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_IN_BUSINESS}/notification-delivery`,
  });

  assert.equal(res.statusCode, 401);
});
