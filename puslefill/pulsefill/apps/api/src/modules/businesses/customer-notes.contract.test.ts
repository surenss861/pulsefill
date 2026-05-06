import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import type { CustomerNoteCreateResponse, CustomerNotesListResponse } from "./customer-notes.js";
import {
  setCompleteCustomerNoteFollowUpTestDelegate,
  setCreateCustomerNoteTestDelegate,
  setListCustomerNotesTestDelegate,
} from "./customer-notes.js";

let app: FastifyInstance;

const CUSTOMER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-111111111111";
const NOTE_ID = "dddddddd-bbbb-4ccc-8ddd-444444444444";

const LIST_SAMPLE: CustomerNotesListResponse = {
  customer_id: CUSTOMER_ID,
  notes: [
    {
      id: "bbbbbbbb-bbbb-4ccc-8ddd-222222222222",
      body: "Prefers morning slots.",
      created_at: "2026-01-05T10:00:00.000Z",
      follow_up_at: "2026-01-06T15:00:00.000Z",
      follow_up_completed_at: null,
      created_by: { name: "Alex Operator" },
    },
  ],
};

const CREATE_SAMPLE: CustomerNoteCreateResponse = {
  note: {
    id: NOTE_ID,
    body: "Trimmed",
    created_at: "2026-01-06T12:00:00.000Z",
    follow_up_at: null,
    follow_up_completed_at: null,
    created_by: { name: "Staff member" },
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
  setListCustomerNotesTestDelegate(null);
  setCreateCustomerNoteTestDelegate(null);
  setCompleteCustomerNoteFollowUpTestDelegate(null);
});

test("GET /v1/businesses/mine/customers/:id/notes returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
  });
  assert.equal(res.statusCode, 401);
});

test("GET /v1/businesses/mine/customers/:id/notes returns 400 for invalid id", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: "/v1/businesses/mine/customers/not-a-uuid/notes",
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 400);
  assert.equal((res.json() as { error: string }).error, "invalid_customer_id");
});

test("GET /v1/businesses/mine/customers/:id/notes returns 404 when customer not in business", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setListCustomerNotesTestDelegate(async () => {
    throw new Error("customer_notes_not_found");
  });

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 404);
  const body = res.json() as { error: string; request_id?: string };
  assert.equal(body.error, "not_found");
  assert.ok(body.request_id);
});

test("GET /v1/businesses/mine/customers/:id/notes returns stable note shape including follow-up fields", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setListCustomerNotesTestDelegate(async () => LIST_SAMPLE);

  const res = await app.inject({
    method: "GET",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as CustomerNotesListResponse;
  assert.equal(body.customer_id, CUSTOMER_ID);
  assert.ok(Array.isArray(body.notes));
  const n = body.notes[0]!;
  assert.deepEqual(
    Object.keys(n).sort(),
    ["body", "created_at", "created_by", "follow_up_at", "follow_up_completed_at", "id"].sort(),
  );
  assert.deepEqual(Object.keys(n.created_by).sort(), ["name"].sort());
  assert.equal(n.follow_up_at, "2026-01-06T15:00:00.000Z");
  assert.equal(n.follow_up_completed_at, null);
  const raw = res.body;
  assert.ok(!raw.includes("device_token"));
  assert.ok(!raw.toLowerCase().includes("auth_user"));
});

test("POST /v1/businesses/mine/customers/:id/notes returns 401 without auth", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: { "content-type": "application/json" },
    payload: JSON.stringify({ body: "hello" }),
  });
  assert.equal(res.statusCode, 401);
});

test("POST /v1/businesses/mine/customers/:id/notes returns 400 for invalid id", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "POST",
    url: "/v1/businesses/mine/customers/not-a-uuid/notes",
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: JSON.stringify({ body: "hello" }),
  });
  assert.equal(res.statusCode, 400);
});

test("POST /v1/businesses/mine/customers/:id/notes returns validation_error for empty body", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: JSON.stringify({ body: "   \n\t  " }),
  });
  assert.equal(res.statusCode, 400);
  const body = res.json() as { error: string };
  assert.equal(body.error, "validation_error");
});

test("POST /v1/businesses/mine/customers/:id/notes returns validation_error for too long body", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: JSON.stringify({ body: "x".repeat(2001) }),
  });
  assert.equal(res.statusCode, 400);
  assert.equal((res.json() as { error: string }).error, "validation_error");
});

test("POST /v1/businesses/mine/customers/:id/notes returns validation_error for invalid follow_up_at", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: JSON.stringify({ body: "hello", follow_up_at: "not-a-date" }),
  });
  assert.equal(res.statusCode, 400);
  const body = res.json() as { error: string };
  assert.equal(body.error, "validation_error");
});

test("POST /v1/businesses/mine/customers/:id/notes returns 404 when customer not in business", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setCreateCustomerNoteTestDelegate(async () => {
    throw new Error("customer_notes_not_found");
  });

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: JSON.stringify({ body: "hello" }),
  });
  assert.equal(res.statusCode, 404);
});

test("POST /v1/businesses/mine/customers/:id/notes trims body and returns 201 without follow_up_at", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  let received = "";
  let receivedFollow: string | null | undefined;
  setCreateCustomerNoteTestDelegate(async ({ body, follow_up_at }) => {
    received = body;
    receivedFollow = follow_up_at;
    return CREATE_SAMPLE;
  });

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: JSON.stringify({ body: "  Trimmed  " }),
  });
  assert.equal(res.statusCode, 201);
  assert.equal(received, "Trimmed");
  assert.equal(receivedFollow, null);
  const body = res.json() as CustomerNoteCreateResponse;
  assert.equal(body.note.body, "Trimmed");
  assert.deepEqual(
    Object.keys(body.note).sort(),
    ["body", "created_at", "created_by", "follow_up_at", "follow_up_completed_at", "id"].sort(),
  );
});

test("POST /v1/businesses/mine/customers/:id/notes passes parsed ISO follow_up_at to create", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  let receivedFollow: string | null | undefined;
  setCreateCustomerNoteTestDelegate(async ({ follow_up_at }) => {
    receivedFollow = follow_up_at;
    return {
      note: {
        ...CREATE_SAMPLE.note,
        follow_up_at: follow_up_at,
      },
    };
  });

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: JSON.stringify({ body: "hello", follow_up_at: "2026-05-06T21:00:00.000Z" }),
  });
  assert.equal(res.statusCode, 201);
  assert.equal(receivedFollow ?? null, "2026-05-06T21:00:00.000Z");
});

test("POST /v1/businesses/mine/customers/:id/notes/:noteId/complete-follow-up returns 400 for invalid note id", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes/not-a-uuid/complete-follow-up`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 400);
  assert.equal((res.json() as { error: string }).error, "invalid_note_id");
});

test("POST complete-follow-up returns 404 when delegate reports not found", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setCompleteCustomerNoteFollowUpTestDelegate(async () => {
    throw new Error("customer_notes_not_found");
  });

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes/${NOTE_ID}/complete-follow-up`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 404);
  assert.equal((res.json() as { error: string }).error, "not_found");
});

test("POST complete-follow-up returns validation_error when note has no follow-up", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setCompleteCustomerNoteFollowUpTestDelegate(async () => {
    throw new Error("customer_notes_no_follow_up");
  });

  const res = await app.inject({
    method: "POST",
    url: `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes/${NOTE_ID}/complete-follow-up`,
    headers: routeTestHeaders(),
  });
  assert.equal(res.statusCode, 400);
  assert.equal((res.json() as { error: string }).error, "validation_error");
});

test("POST complete-follow-up is idempotent when already completed", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const completedNote = {
    ...CREATE_SAMPLE.note,
    follow_up_at: "2026-01-01T10:00:00.000Z",
    follow_up_completed_at: "2026-01-02T08:00:00.000Z",
  };
  setCompleteCustomerNoteFollowUpTestDelegate(async () => ({
    note: completedNote,
  }));

  const url = `/v1/businesses/mine/customers/${CUSTOMER_ID}/notes/${NOTE_ID}/complete-follow-up`;
  const res1 = await app.inject({ method: "POST", url, headers: routeTestHeaders() });
  const res2 = await app.inject({ method: "POST", url, headers: routeTestHeaders() });
  assert.equal(res1.statusCode, 200);
  assert.equal(res2.statusCode, 200);
  const j1 = res1.json() as CustomerNoteCreateResponse;
  const j2 = res2.json() as CustomerNoteCreateResponse;
  assert.equal(j1.note.follow_up_completed_at, "2026-01-02T08:00:00.000Z");
  assert.equal(j2.note.follow_up_completed_at, "2026-01-02T08:00:00.000Z");
});
