import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchCustomerClaimStatus } from "./claim-status.js";
import { fetchCustomerOfferDetail } from "./offer-detail.js";

function offerAdminMock(row: Record<string, unknown> | null, err: Error | null = null) {
  return {
    from(table: string) {
      assert.equal(table, "slot_offers");
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return { data: row, error: err };
        },
      };
    },
  } as unknown as SupabaseClient;
}

test("fetchCustomerOfferDetail returns not_found when no row matches customer-scoped query", async () => {
  const out = await fetchCustomerOfferDetail(offerAdminMock(null), "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.status, 404);
    assert.equal(out.error, "not_found");
  }
});

test("fetchCustomerOfferDetail returns load_failed when Supabase returns an error", async () => {
  const out = await fetchCustomerOfferDetail(
    offerAdminMock(null, new Error("db")),
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  );
  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.status, 500);
    assert.equal(out.error, "load_failed");
  }
});

function claimAdminMock(claimRow: Record<string, unknown> | null, offerErr: boolean) {
  return {
    from(table: string) {
      if (table === "slot_claims") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return { data: claimRow, error: null };
          },
        };
      }
      if (table === "businesses" || table === "locations" || table === "services" || table === "providers") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return { data: { name: "X" }, error: null };
          },
        };
      }
      if (table === "slot_offers") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return { data: offerErr ? null : { id: "offer-1" }, error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("fetchCustomerClaimStatus returns not_found when claim row is absent", async () => {
  const out = await fetchCustomerClaimStatus(claimAdminMock(null, false), "cust-1", "claim-1");
  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.status, 404);
    assert.equal(out.error, "not_found");
  }
});

test("fetchCustomerClaimStatus returns slot_missing when embedded open_slots is absent", async () => {
  const out = await fetchCustomerClaimStatus(
    claimAdminMock({ id: "claim-1", status: "won", open_slot_id: "slot-1", claimed_at: null, open_slots: null }, false),
    "cust-1",
    "claim-1",
  );
  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.status, 404);
    assert.equal(out.error, "slot_missing");
  }
});
