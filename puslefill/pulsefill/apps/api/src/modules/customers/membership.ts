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
