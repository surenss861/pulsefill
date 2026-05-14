import type { SupabaseClient } from "@supabase/supabase-js";

export async function countPendingStandbyRequestsForBusiness(
  admin: SupabaseClient,
  businessId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("customer_standby_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}
