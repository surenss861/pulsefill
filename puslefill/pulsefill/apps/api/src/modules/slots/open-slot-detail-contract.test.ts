import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { setOpenSlotDetailTestDelegate } from "./open-slots.routes.js";

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
  setOpenSlotDetailTestDelegate(null);
});

test("GET /v1/open-slots/:id returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}`,
  });

  assert.equal(res.statusCode, 401);
  assert.equal((res.json() as { error: string }).error, "unauthorized");
});

test("GET /v1/open-slots/:id returns 404 for missing or wrong-tenant slot", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setOpenSlotDetailTestDelegate(async () => ({ kind: "not_found" }));

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 404);
  const notFound = res.json() as { error: string; request_id?: string };
  assert.equal(notFound.error, "not_found");
  assert.ok(notFound.request_id && typeof notFound.request_id === "string");
});

test("GET /v1/open-slots/:id returns stable detail contract", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setOpenSlotDetailTestDelegate(async () => ({
    kind: "ok",
    payload: {
      slot: {
        id: SLOT_ID,
        status: "claimed",
        notes: null,
        winning_claim: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "won",
          customer_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          claimed_at: "2026-04-16T10:00:00.000Z",
        },
        last_touched_by: null,
      },
      queue_context: {
        current_category: "awaiting_confirmation",
        current_section: "needs_action",
        reason_title: "Confirm booking",
        reason_detail: "A customer claimed this opening and is waiting for confirmation.",
        severity: "high",
      },
      available_actions: ["confirm_booking", "add_note", "inspect_notification_logs"],
    },
  }));

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as {
    slot: Record<string, unknown>;
    queue_context: Record<string, unknown>;
    available_actions: unknown;
  };

  assert.ok(body.slot);
  assert.equal(body.slot.id, SLOT_ID);
  assert.equal(typeof body.slot.status, "string");
  assert.ok(Object.hasOwn(body.slot, "winning_claim"));
  assert.ok(Object.hasOwn(body.slot, "last_touched_by"));

  assert.ok(body.queue_context);
  assert.equal(typeof body.queue_context.current_category, "string");
  assert.equal(typeof body.queue_context.current_section, "string");
  assert.equal(typeof body.queue_context.reason_title, "string");

  assert.ok(Array.isArray(body.available_actions));
  assert.ok((body.available_actions as string[]).includes("confirm_booking"));
});

test("GET /v1/open-slots/:id keeps nullable and empty states stable", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setOpenSlotDetailTestDelegate(async () => ({
    kind: "ok",
    payload: {
      slot: {
        id: SLOT_ID,
        status: "open",
        notes: null,
        winning_claim: null,
        last_touched_by: null,
      },
      queue_context: {
        current_category: null,
        current_section: null,
        reason_title: null,
        reason_detail: null,
        severity: null,
      },
      available_actions: ["send_offers", "expire_slot", "cancel_slot", "add_note"],
    },
  }));

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as {
    slot: { winning_claim: unknown; notes: unknown; last_touched_by: unknown };
    queue_context: { current_category: unknown; reason_title: unknown };
    available_actions: string[];
  };

  assert.equal(body.slot.winning_claim, null);
  assert.equal(body.slot.notes, null);
  assert.equal(body.slot.last_touched_by, null);
  assert.equal(body.queue_context.current_category, null);
  assert.equal(body.queue_context.reason_title, null);
  assert.ok(body.available_actions.includes("send_offers"));
});

test("GET /v1/open-slots/:id returns 500 load_failed when detail loader throws", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setOpenSlotDetailTestDelegate(async () => {
    throw new Error("boom");
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/open-slots/${SLOT_ID}`,
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 500);
  const loadFailed = res.json() as { error: string; request_id?: string };
  assert.equal(loadFailed.error, "load_failed");
  assert.ok(loadFailed.request_id && typeof loadFailed.request_id === "string");
});
