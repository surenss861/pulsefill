import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import { setLoadSlotRuleContextTestDelegate } from "./load-slot-rule-context.js";
import { resetOpenSlotsRouteMutationTestDelegates } from "./open-slots-route-test-seams.js";

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
  setLoadSlotRuleContextTestDelegate(null);
  resetOpenSlotsRouteMutationTestDelegates();
});

test("POST send-offers for slot outside staff business returns 404 with request_id (no cross-tenant mutation)", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setLoadSlotRuleContextTestDelegate(async () => null);

  const res = await app.inject({
    method: "POST",
    url: `/v1/open-slots/${SLOT_ID}/send-offers`,
    headers: { ...routeTestHeaders(), "content-type": "application/json" },
    payload: {},
  });

  assert.equal(res.statusCode, 404);
  const body = res.json() as { error: { code: string; retryable: boolean }; request_id?: string };
  assert.equal(body.error.code, "not_found");
  assert.equal(body.error.retryable, false);
  assert.ok(body.request_id && typeof body.request_id === "string");
});
