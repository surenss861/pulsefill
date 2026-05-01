import type { SupabaseClient } from "@supabase/supabase-js";

export type MembershipSource = "invite" | "request" | "public";

export async function upsertActiveCustomerMembership(
  admin: SupabaseClient,
  customerId: string,
  businessId: string,
  source: MembershipSource,
): Promise<void> {
  const { error } = await admin.from("customer_business_memberships").upsert(
    {
      customer_id: customerId,
      business_id: businessId,
      status: "active",
      source,
    },
    { onConflict: "customer_id,business_id" },
  );
  if (error) throw error;
}

/** Active membership required before mutating standby prefs for a business. */
export async function assertActiveCustomerBusinessMembership(
  admin: SupabaseClient,
  customerId: string,
  businessId: string,
): Promise<"ok" | "missing" | "error"> {
  const { data, error } = await admin
    .from("customer_business_memberships")
    .select("id")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .eq("status", "active")
    .maybeSingle();
  if (error) return "error";
  if (!data) return "missing";
  return "ok";
}

export type CustomerBusinessMetadataReadResult =
  | { ok: true; business: { id: string; name: string } }
  | { ok: false; status: 403 | 404 | 500; error: string; message?: string };

/**
 * Customer-safe reads (services list, standby labels) for a `business_id`:
 * - If `customer_discovery_enabled` is true → allowed without membership (directory / discovery).
 * - Otherwise → requires active `customer_business_memberships` (private or non-discoverable businesses).
 */
export async function assertCustomerBusinessMetadataReadAllowed(
  admin: SupabaseClient,
  customerId: string,
  businessId: string,
): Promise<CustomerBusinessMetadataReadResult> {
  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id, name, customer_discovery_enabled")
    .eq("id", businessId)
    .maybeSingle();

  if (bizErr) return { ok: false, status: 500, error: "lookup_failed" };
  if (!biz) return { ok: false, status: 404, error: "business_not_found" };

  const row = biz as {
    id: string;
    name?: string | null;
    customer_discovery_enabled?: boolean | null;
  };

  const name = String(row.name ?? "");
  if (row.customer_discovery_enabled === true) {
    return { ok: true, business: { id: row.id, name } };
  }

  const mem = await assertActiveCustomerBusinessMembership(admin, customerId, businessId);
  if (mem === "error") return { ok: false, status: 500, error: "membership_lookup_failed" };
  if (mem === "missing") {
    return {
      ok: false,
      status: 403,
      error: "business_membership_required",
      message: "Join this business before viewing standby details.",
    };
  }

  return { ok: true, business: { id: row.id, name } };
}
