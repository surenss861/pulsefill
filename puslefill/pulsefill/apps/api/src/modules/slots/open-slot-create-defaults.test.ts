import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../../app.js";
import { createTestEnv } from "../../test/helpers/env.js";
import { routeTestHeaders } from "../../test/helpers/app.js";
import {
  dedupeRecentSlotCombinations,
  setOpenSlotCreateDefaultsTestDelegate,
} from "./open-slot-create-defaults.js";

type Row = Parameters<typeof dedupeRecentSlotCombinations>[0][number];

test("dedupeRecentSlotCombinations keeps first occurrence per triple (most recent first)", () => {
  const rows: Row[] = [
    {
      location_id: "a",
      provider_id: "b",
      service_id: "c",
      provider_name_snapshot: null,
      created_at: "2025-01-02T00:00:00Z",
      locations: null,
      providers: null,
      services: null,
    },
    {
      location_id: "a",
      provider_id: "b",
      service_id: "c",
      provider_name_snapshot: null,
      created_at: "2025-01-01T00:00:00Z",
      locations: null,
      providers: null,
      services: null,
    },
    {
      location_id: "x",
      provider_id: "y",
      service_id: "z",
      provider_name_snapshot: null,
      created_at: "2025-01-01T12:00:00Z",
      locations: null,
      providers: null,
      services: null,
    },
  ];
  const out = dedupeRecentSlotCombinations(rows);
  assert.equal(out.length, 2);
  assert.equal(out[0]?.created_at, "2025-01-02T00:00:00Z");
  assert.equal(out[1]?.location_id, "x");
});

test("dedupeRecentSlotCombinations skips rows missing any id", () => {
  const rows: Row[] = [
    {
      location_id: "a",
      provider_id: null,
      service_id: "c",
      provider_name_snapshot: null,
      created_at: "2025-01-02T00:00:00Z",
      locations: null,
      providers: null,
      services: null,
    },
    {
      location_id: "a",
      provider_id: "b",
      service_id: "c",
      provider_name_snapshot: null,
      created_at: "2025-01-01T00:00:00Z",
      locations: null,
      providers: null,
      services: null,
    },
  ];
  const out = dedupeRecentSlotCombinations(rows);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.provider_id, "b");
});

let app: FastifyInstance;

before(async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;
  app = await buildApp(createTestEnv());
});

after(async () => {
  if (app) await app.close();
});

afterEach(() => {
  setOpenSlotCreateDefaultsTestDelegate(null);
});

test("GET /v1/open-slots/create-defaults returns 401 without Authorization", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  const res = await app.inject({
    method: "GET",
    url: "/v1/open-slots/create-defaults",
  });

  assert.equal(res.statusCode, 401);
});

test("GET /v1/open-slots/create-defaults returns payload shape", async () => {
  if (process.env.PULSEFILL_API_TEST !== "1") return;

  setOpenSlotCreateDefaultsTestDelegate(async () => ({
    recent_combinations: [
      {
        location_id: "11111111-1111-4111-8111-111111111111",
        provider_id: "22222222-2222-4222-8222-222222222222",
        service_id: "33333333-3333-4333-8333-333333333333",
        label: "Cleaning · Dr. A · Main",
        last_used_at: "2025-06-01T12:00:00Z",
      },
    ],
    defaults: {
      location_id: "11111111-1111-4111-8111-111111111111",
      provider_id: null,
      service_id: null,
    },
    setup_warnings: ["Add a provider."],
  }));

  const res = await app.inject({
    method: "GET",
    url: "/v1/open-slots/create-defaults",
    headers: routeTestHeaders(),
  });

  assert.equal(res.statusCode, 200);
  const body = res.json() as {
    recent_combinations: Array<{ label: string; location_id: string }>;
    defaults: { location_id: string | null; provider_id: string | null; service_id: string | null };
    setup_warnings: string[];
  };
  assert.equal(body.recent_combinations.length, 1);
  assert.equal(body.recent_combinations[0]?.label, "Cleaning · Dr. A · Main");
  assert.equal(body.defaults.location_id, "11111111-1111-4111-8111-111111111111");
  assert.deepEqual(body.setup_warnings, ["Add a provider."]);
});
