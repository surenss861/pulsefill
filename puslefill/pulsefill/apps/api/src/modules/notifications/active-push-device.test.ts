import assert from "node:assert/strict";
import test from "node:test";

import {
  getActivePushDeviceForCustomer,
  pickBestActivePushDevice,
  type SupabaseClientLike,
} from "./active-push-device.js";

const CUSTOMER_A = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_B = "22222222-2222-4222-8222-222222222222";

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    customer_id: CUSTOMER_A,
    device_token: "token_a",
    platform: "ios",
    token_type: "apns",
    active: true,
    last_seen_at: "2026-04-25T15:00:00.000Z",
    updated_at: "2026-04-25T14:00:00.000Z",
    created_at: "2026-04-24T14:00:00.000Z",
    ...overrides,
  } as {
    customer_id: string;
    device_token: string | null;
    platform: "ios" | "android" | "web";
    token_type: "apns" | "expo";
    active: boolean;
    last_seen_at?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
  };
}

function fakeSupabase(rows: ReturnType<typeof row>[], error?: { code?: string; message?: string }): SupabaseClientLike {
  return {
    from: (table: string) => {
      assert.equal(table, "customer_push_devices");
      return {
        select: (_fields: string) => {
          const filters: Array<{ field: string; value: string | boolean }> = [];
          return {
            eq(field: string, value: string | boolean) {
              filters.push({ field, value });
              return this;
            },
            order() {
              return this;
            },
            async limit() {
              if (error) return { data: null, error };
              let filtered = [...rows];
              for (const f of filters) {
                filtered = filtered.filter((r) => String((r as Record<string, unknown>)[f.field]) === String(f.value));
              }
              return { data: filtered, error: null };
            },
          };
        },
      };
    },
  };
}

test("pickBestActivePushDevice prefers most recent last_seen_at", () => {
  const picked = pickBestActivePushDevice([
    row({ device_token: "older", last_seen_at: "2026-04-25T13:00:00.000Z" }),
    row({ device_token: "newer", last_seen_at: "2026-04-25T16:00:00.000Z" }),
  ]);
  assert.equal(picked?.token, "newer");
});

test("pickBestActivePushDevice falls back to updated_at then created_at", () => {
  const picked = pickBestActivePushDevice([
    row({ device_token: "a", last_seen_at: null, updated_at: "2026-04-25T12:00:00.000Z" }),
    row({ device_token: "b", last_seen_at: null, updated_at: "2026-04-25T14:00:00.000Z" }),
  ]);
  assert.equal(picked?.token, "b");
});

test("pickBestActivePushDevice ignores inactive and blank tokens", () => {
  const picked = pickBestActivePushDevice([
    row({ device_token: " ", active: true }),
    row({ device_token: "inactive", active: false }),
    row({ device_token: "valid", active: true }),
  ]);
  assert.equal(picked?.token, "valid");
});

test("getActivePushDeviceForCustomer filters by customer", async () => {
  const supabase = fakeSupabase([row({ customer_id: CUSTOMER_B }), row({ customer_id: CUSTOMER_A, device_token: "token_ok" })]);
  const device = await getActivePushDeviceForCustomer({ supabase, customerId: CUSTOMER_A });
  assert.equal(device?.token, "token_ok");
});

test("getActivePushDeviceForCustomer filters by platform", async () => {
  const supabase = fakeSupabase([
    row({ device_token: "ios_token", platform: "ios" }),
    row({ device_token: "web_token", platform: "web" }),
  ]);
  const device = await getActivePushDeviceForCustomer({
    supabase,
    customerId: CUSTOMER_A,
    platform: "web",
  });
  assert.equal(device?.token, "web_token");
  assert.equal(device?.platform, "web");
});

test("getActivePushDeviceForCustomer filters by token_type", async () => {
  const supabase = fakeSupabase([
    row({ device_token: "apns_token", token_type: "apns" }),
    row({ device_token: "expo_token", token_type: "expo" }),
  ]);
  const device = await getActivePushDeviceForCustomer({
    supabase,
    customerId: CUSTOMER_A,
    tokenType: "expo",
  });
  assert.equal(device?.token, "expo_token");
  assert.equal(device?.token_type, "expo");
});

test("getActivePushDeviceForCustomer returns null when none eligible", async () => {
  const supabase = fakeSupabase([
    row({ active: false }),
    row({ device_token: "   " }),
  ]);
  const device = await getActivePushDeviceForCustomer({
    supabase,
    customerId: CUSTOMER_A,
  });
  assert.equal(device, null);
});

test("getActivePushDeviceForCustomer throws stable code on Supabase error", async () => {
  const supabase = fakeSupabase([], { code: "XX500", message: "boom" });
  await assert.rejects(
    () => getActivePushDeviceForCustomer({ supabase, customerId: CUSTOMER_A }),
    /active_push_device_lookup_failed:XX500/,
  );
});
