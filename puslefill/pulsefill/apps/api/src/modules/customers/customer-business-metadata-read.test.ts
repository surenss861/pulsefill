import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { assertCustomerBusinessMetadataReadAllowed } from "./membership.js";

const BID = "22222222-2222-4222-8222-222222222222";
const CID = "11111111-1111-4111-8111-111111111111";

type MembershipState = "ok" | "missing" | "error";

function createAdminMock(args: {
  business: Record<string, unknown> | null;
  businessDbError?: Error | null;
  membership: MembershipState;
}) {
  return {
    from(table: string) {
      if (table === "businesses") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return { data: args.business, error: args.businessDbError ?? null };
          },
        };
      }
      if (table === "customer_business_memberships") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            if (args.membership === "error") {
              return { data: null, error: new Error("db") };
            }
            if (args.membership === "missing") {
              return { data: null, error: null };
            }
            return { data: { id: "mem-1" }, error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

test("allows read when customer_discovery_enabled is true without membership", async () => {
  const admin = createAdminMock({
    business: {
      id: BID,
      name: "Discoverable Clinic",
      customer_discovery_enabled: true,
    },
    membership: "missing",
  });
  const out = await assertCustomerBusinessMetadataReadAllowed(admin, CID, BID);
  assert.equal(out.ok, true);
  if (out.ok) {
    assert.equal(out.business.id, BID);
    assert.equal(out.business.name, "Discoverable Clinic");
  }
});

test("blocks read when discovery disabled and membership missing", async () => {
  const admin = createAdminMock({
    business: {
      id: BID,
      name: "Private Clinic",
      customer_discovery_enabled: false,
    },
    membership: "missing",
  });
  const out = await assertCustomerBusinessMetadataReadAllowed(admin, CID, BID);
  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.status, 403);
    assert.equal(out.error, "business_membership_required");
    assert.ok(out.message?.includes("Join"));
  }
});

test("allows read when discovery disabled but membership active", async () => {
  const admin = createAdminMock({
    business: {
      id: BID,
      name: "Private Clinic",
      customer_discovery_enabled: false,
    },
    membership: "ok",
  });
  const out = await assertCustomerBusinessMetadataReadAllowed(admin, CID, BID);
  assert.equal(out.ok, true);
  if (out.ok) {
    assert.equal(out.business.name, "Private Clinic");
  }
});

test("returns membership_lookup_failed when membership query errors", async () => {
  const admin = createAdminMock({
    business: {
      id: BID,
      name: "Private Clinic",
      customer_discovery_enabled: false,
    },
    membership: "error",
  });
  const out = await assertCustomerBusinessMetadataReadAllowed(admin, CID, BID);
  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.status, 500);
    assert.equal(out.error, "membership_lookup_failed");
  }
});

test("returns business_not_found when business row absent", async () => {
  const admin = createAdminMock({ business: null, membership: "missing" });
  const out = await assertCustomerBusinessMetadataReadAllowed(admin, CID, BID);
  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.status, 404);
    assert.equal(out.error, "business_not_found");
  }
});

test("treats null customer_discovery_enabled like false (membership required)", async () => {
  const admin = createAdminMock({
    business: {
      id: BID,
      name: "Legacy Row",
      customer_discovery_enabled: null,
    },
    membership: "missing",
  });
  const out = await assertCustomerBusinessMetadataReadAllowed(admin, CID, BID);
  assert.equal(out.ok, false);
  if (!out.ok) assert.equal(out.status, 403);
});
