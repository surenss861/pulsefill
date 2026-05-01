import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { assertActiveCustomerBusinessMembership } from "./membership.js";

function membershipsAdminMock(hasRow: boolean, err: Error | null) {
  return {
    from(table: string) {
      assert.equal(table, "customer_business_memberships");
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return {
            data: err ? null : hasRow ? { id: "m1" } : null,
            error: err,
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

test("assertActiveCustomerBusinessMembership returns ok when an active row exists", async () => {
  const r = await assertActiveCustomerBusinessMembership(membershipsAdminMock(true, null), "c1", "b1");
  assert.equal(r, "ok");
});

test("assertActiveCustomerBusinessMembership returns missing when no row", async () => {
  const r = await assertActiveCustomerBusinessMembership(membershipsAdminMock(false, null), "c1", "b1");
  assert.equal(r, "missing");
});

test("assertActiveCustomerBusinessMembership returns error when lookup fails", async () => {
  const r = await assertActiveCustomerBusinessMembership(membershipsAdminMock(false, new Error("db")), "c1", "b1");
  assert.equal(r, "error");
});
