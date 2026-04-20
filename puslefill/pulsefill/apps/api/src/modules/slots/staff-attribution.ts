import type { createServiceSupabase } from "../../config/supabase.js";

type Admin = ReturnType<typeof createServiceSupabase>;

export function staffActorMetadata(authUserId: string): { staff_auth_user_id: string } {
  return { staff_auth_user_id: authUserId };
}

export async function touchOpenSlotByStaff(admin: Admin, openSlotId: string, staffUserId: string): Promise<void> {
  await admin
    .from("open_slots")
    .update({
      last_touched_by_staff_id: staffUserId,
      last_touched_at: new Date().toISOString(),
    })
    .eq("id", openSlotId);
}

/** Resolve staff_users.id → display label for timeline enrichment. */
export async function loadStaffActorLabels(
  admin: Admin,
  businessId: string,
  staffIds: string[],
): Promise<Map<string, string>> {
  const uniq = [...new Set(staffIds.filter(Boolean))];
  const map = new Map<string, string>();
  if (uniq.length === 0) return map;

  const { data, error } = await admin
    .from("staff_users")
    .select("id, full_name, email")
    .eq("business_id", businessId)
    .in("id", uniq);

  if (error || !data) return map;

  for (const row of data as { id: string; full_name: string | null; email: string | null }[]) {
    const name = row.full_name?.trim();
    const emailLocal = row.email?.split("@")[0]?.trim();
    const label = name && name.length > 0 ? name : emailLocal && emailLocal.length > 0 ? emailLocal : "Staff";
    map.set(row.id, label);
  }
  return map;
}

export function mergeMetadata(
  base: Record<string, unknown>,
  authUserId: string,
): Record<string, unknown> {
  return { ...base, ...staffActorMetadata(authUserId) };
}
