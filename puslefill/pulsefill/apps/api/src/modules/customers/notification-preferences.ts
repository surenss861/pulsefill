import type { SupabaseClient } from "@supabase/supabase-js";

const CADENCE = ["all_opportunities", "best_matches", "important_only"] as const;

export type NotificationPreferencesRow = {
  quiet_hours_enabled: boolean;
  quiet_hours_start_local: string | null;
  quiet_hours_end_local: string | null;
  cadence_preference: string;
  notify_new_offers: boolean;
  notify_claim_updates: boolean;
  notify_booking_confirmations: boolean;
  notify_standby_tips: boolean;
};

const defaults: NotificationPreferencesRow = {
  quiet_hours_enabled: false,
  quiet_hours_start_local: null,
  quiet_hours_end_local: null,
  cadence_preference: "all_opportunities",
  notify_new_offers: true,
  notify_claim_updates: true,
  notify_booking_confirmations: true,
  notify_standby_tips: true,
};

function normalizeRow(row: Record<string, unknown> | null): NotificationPreferencesRow {
  if (!row) return { ...defaults };
  return {
    quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
    quiet_hours_start_local: (row.quiet_hours_start_local as string | null) ?? null,
    quiet_hours_end_local: (row.quiet_hours_end_local as string | null) ?? null,
    cadence_preference: CADENCE.includes(row.cadence_preference as (typeof CADENCE)[number])
      ? (row.cadence_preference as string)
      : defaults.cadence_preference,
    notify_new_offers: row.notify_new_offers !== false,
    notify_claim_updates: row.notify_claim_updates !== false,
    notify_booking_confirmations: row.notify_booking_confirmations !== false,
    notify_standby_tips: row.notify_standby_tips !== false,
  };
}

export async function getCustomerNotificationPreferences(
  admin: SupabaseClient,
  customerId: string,
  pushPermissionStatus: string,
): Promise<Record<string, unknown>> {
  const { data } = await admin
    .from("customer_notification_preferences")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();

  const prefs = normalizeRow((data as Record<string, unknown>) ?? null);

  const { count } = await admin
    .from("customer_push_devices")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("active", true);

  return {
    preferences: prefs,
    readiness: {
      push_permission_status: pushPermissionStatus,
      has_push_device: (count ?? 0) > 0,
    },
  };
}

export async function patchCustomerNotificationPreferences(
  admin: SupabaseClient,
  customerId: string,
  body: Record<string, unknown>,
  pushPermissionStatus: string,
): Promise<Record<string, unknown> | { error: string; status: number }> {
  const quietEnabled = Boolean(body.quiet_hours_enabled);
  const start = (body.quiet_hours_start_local as string | null | undefined) ?? null;
  const end = (body.quiet_hours_end_local as string | null | undefined) ?? null;
  const cadence = String(body.cadence_preference ?? defaults.cadence_preference);
  if (!CADENCE.includes(cadence as (typeof CADENCE)[number])) {
    return { error: "invalid_cadence", status: 400 };
  }
  if (quietEnabled && (!start || !end)) {
    return { error: "quiet_hours_need_start_end", status: 400 };
  }

  const row = {
    customer_id: customerId,
    quiet_hours_enabled: quietEnabled,
    quiet_hours_start_local: quietEnabled ? start : null,
    quiet_hours_end_local: quietEnabled ? end : null,
    cadence_preference: cadence,
    notify_new_offers: body.notify_new_offers !== false,
    notify_claim_updates: body.notify_claim_updates !== false,
    notify_booking_confirmations: body.notify_booking_confirmations !== false,
    notify_standby_tips: body.notify_standby_tips !== false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("customer_notification_preferences").upsert(row, { onConflict: "customer_id" });
  if (error) return { error: "save_failed", status: 500 };

  return getCustomerNotificationPreferences(admin, customerId, pushPermissionStatus);
}
