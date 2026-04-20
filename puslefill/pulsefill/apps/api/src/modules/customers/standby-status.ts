import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStandbyGuidance } from "./standby-guidance.js";

const ACTIVITY_DAYS = 30;

type PrefRow = {
  id: string;
  business_id: string;
  active: boolean;
  max_notice_hours: number | null;
  businesses: { name: string } | { name: string }[] | null;
  services: { name: string } | { name: string }[] | null;
  locations: { name: string } | { name: string }[] | null;
  providers: { name: string } | { name: string }[] | null;
};

function normalizeNested<T>(v: T | T[] | null): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function fetchCustomerStandbyStatus(
  admin: SupabaseClient,
  customerId: string,
  opts: { pushPermissionStatus: string },
) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - ACTIVITY_DAYS);
  const sinceIso = since.toISOString();

  const [
    { data: customer, error: customerErr },
    { data: prefRows, error: prefErr },
    { count: pushDeviceCount, error: pushErr },
    { count: offersCount, error: offersErr },
    { count: claimsCount, error: claimsErr },
    { count: expiredOffersCount, error: expiredOffersErr },
    { count: lostClaimsCount, error: lostClaimsErr },
  ] = await Promise.all([
    admin.from("customers").select("email, phone, push_enabled, sms_enabled, email_enabled").eq("id", customerId).maybeSingle(),
    admin
      .from("standby_preferences")
      .select(
        `
        id,
        business_id,
        active,
        max_notice_hours,
        businesses ( name ),
        services ( name ),
        locations ( name ),
        providers ( name )
      `,
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    admin
      .from("customer_push_devices")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("active", true),
    admin
      .from("slot_offers")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .gte("sent_at", sinceIso),
    admin
      .from("slot_claims")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .gte("claimed_at", sinceIso),
    admin
      .from("slot_offers")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("status", "expired")
      .gte("sent_at", sinceIso),
    admin
      .from("slot_claims")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("status", "lost")
      .gte("claimed_at", sinceIso),
  ]);

  if (customerErr) throw new Error("customer_load_failed");
  if (prefErr) throw new Error("preferences_load_failed");
  if (pushErr) throw new Error("push_devices_failed");
  if (offersErr) throw new Error("offers_count_failed");
  if (claimsErr) throw new Error("claims_count_failed");
  if (expiredOffersErr) throw new Error("expired_offers_count_failed");
  if (lostClaimsErr) throw new Error("lost_claims_count_failed");

  const prefs = (prefRows ?? []) as PrefRow[];
  const activePrefs = prefs.filter((p) => p.active);
  const pausedPrefs = prefs.filter((p) => !p.active);

  const distinctActiveBusinesses = new Set(activePrefs.map((p) => p.business_id)).size;

  const email = (customer?.email as string | null | undefined)?.trim() ?? "";
  const phone = (customer?.phone as string | null | undefined)?.trim() ?? "";
  const pushEnabled = Boolean(customer?.push_enabled ?? true);
  const smsEnabled = Boolean(customer?.sms_enabled ?? false);
  const emailEnabled = Boolean(customer?.email_enabled ?? true);

  const hasEmail = email.length > 0;
  const hasSmsChannel = phone.length > 0;
  const hasSms = hasSmsChannel && smsEnabled;

  const hasPushDevice = (pushDeviceCount ?? 0) > 0;
  const pushPermissionStatus = opts.pushPermissionStatus;

  const pushReachable =
    hasPushDevice &&
    pushEnabled &&
    pushPermissionStatus !== "denied" &&
    (pushPermissionStatus === "authorized" ||
      pushPermissionStatus === "not_determined" ||
      pushPermissionStatus === "unknown");

  const emailReachable = hasEmail && emailEnabled;
  const smsReachable = hasSmsChannel && smsEnabled;

  const hasAnyReachableChannel = Boolean(pushReachable || emailReachable || smsReachable);

  const guidance = buildStandbyGuidance({
    activePreferences: activePrefs.length,
    pausedPreferences: pausedPrefs.length,
    hasPushDevice,
    pushPermissionStatus,
    pushEnabled,
    hasEmail,
    hasSms,
    hasAnyReachableChannel,
  });

  return {
    summary: {
      active_preferences: activePrefs.length,
      paused_preferences: pausedPrefs.length,
      businesses_covered: distinctActiveBusinesses,
      has_any_active_preference: activePrefs.length > 0,
    },
    notification_readiness: {
      push_permission_status: pushPermissionStatus,
      has_push_device: hasPushDevice,
      has_email: hasEmail,
      has_sms: hasSms,
      has_any_reachable_channel: hasAnyReachableChannel,
    },
    recent_activity: {
      recent_offers: offersCount ?? 0,
      recent_claims: claimsCount ?? 0,
      recent_missed: (expiredOffersCount ?? 0) + (lostClaimsCount ?? 0),
      window_days: ACTIVITY_DAYS,
    },
    preferences: prefs.map((p) => {
      const biz = normalizeNested(p.businesses);
      const svc = normalizeNested(p.services);
      const loc = normalizeNested(p.locations);
      const prov = normalizeNested(p.providers);
      return {
        id: p.id,
        active: p.active,
        business_name: biz?.name ?? null,
        service_name: svc?.name ?? null,
        location_name: loc?.name ?? null,
        provider_name: prov?.name ?? null,
        max_notice_hours: p.max_notice_hours,
      };
    }),
    guidance,
  };
}
