import assert from "node:assert/strict";
import test from "node:test";

import { executeBulkOpenSlotAction } from "./bulk-actions.js";

import type { Env } from "../../config/env.js";

const stubEnv = {} as Env;

test("executeBulkOpenSlotAction with empty ids returns summary zeros without DB", async () => {
  const admin = {} as never;
  const out = await executeBulkOpenSlotAction(admin, stubEnv, {
    businessId: "00000000-0000-4000-8000-000000000001",
    staffId: "00000000-0000-4000-8000-000000000002",
    authUserId: "00000000-0000-4000-8000-000000000003",
    action: "expire",
    openSlotIds: [],
  });
  assert.equal(out.ok, true);
  assert.equal(out.action, "expire");
  assert.deepEqual(out.summary, { requested: 0, processed: 0, skipped: 0, failed: 0 });
  assert.equal(out.results.length, 0);
  assert.match(out.message, /No slots/);
});

test("executeBulkOpenSlotAction marks all failed when open_slots batch load errors", async () => {
  const slotId = "00000000-0000-4000-8000-0000000000aa";
  const admin = {
    from() {
      return {
        select() {
          return {
            in() {
              return {
                eq: async () => ({ data: null, error: { message: "db error" } }),
              };
            },
          };
        },
      };
    },
  };
  const out = await executeBulkOpenSlotAction(admin as never, stubEnv, {
    businessId: "00000000-0000-4000-8000-000000000001",
    staffId: "00000000-0000-4000-8000-000000000002",
    authUserId: "00000000-0000-4000-8000-000000000003",
    action: "retry_offers",
    openSlotIds: [slotId],
  });
  assert.equal(out.summary.requested, 1);
  assert.equal(out.summary.processed, 0);
  assert.equal(out.summary.failed, 1);
  const first = out.results[0];
  assert.ok(first);
  assert.equal(first.open_slot_id, slotId);
  assert.equal(first.status, "failed");
  assert.equal(first.code, "load_failed");
});

test("executeBulkOpenSlotAction skips slot ids not returned for business (wrong tenant or missing)", async () => {
  const slotId = "00000000-0000-4000-8000-0000000000bb";
  const admin = {
    from() {
      return {
        select() {
          return {
            in() {
              return {
                eq: async () => ({ data: [], error: null }),
              };
            },
          };
        },
      };
    },
  };
  const out = await executeBulkOpenSlotAction(admin as never, stubEnv, {
    businessId: "00000000-0000-4000-8000-000000000001",
    staffId: "00000000-0000-4000-8000-000000000002",
    authUserId: "00000000-0000-4000-8000-000000000003",
    action: "expire",
    openSlotIds: [slotId],
  });
  assert.equal(out.summary.requested, 1);
  assert.equal(out.summary.skipped, 1);
  const row = out.results[0];
  assert.ok(row);
  assert.equal(row.status, "skipped");
  assert.equal(row.code, "not_found");
});

test("executeBulkOpenSlotAction dedupes duplicate ids preserving order", async () => {
  const id = "00000000-0000-4000-8000-0000000000cc";
  const admin = {
    from() {
      return {
        select() {
          return {
            in(_col: string, ids: string[]) {
              assert.deepEqual(ids, [id]);
              return {
                eq: async () => ({ data: [], error: null }),
              };
            },
          };
        },
      };
    },
  };
  const out = await executeBulkOpenSlotAction(admin as never, stubEnv, {
    businessId: "00000000-0000-4000-8000-000000000001",
    staffId: "00000000-0000-4000-8000-000000000002",
    authUserId: "00000000-0000-4000-8000-000000000003",
    action: "expire",
    openSlotIds: [id, id, id],
  });
  assert.equal(out.summary.requested, 1);
  assert.equal(out.results.length, 1);
});
