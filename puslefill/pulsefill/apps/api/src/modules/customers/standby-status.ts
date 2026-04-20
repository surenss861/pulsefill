import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildStandbyReadinessInputFromLoaded,
  computeCustomerStandbyReadiness,
  fetchCustomerStandbyPrereqs,
  type StandbyPreferenceRow,
} from "./customer-standby-readiness.js";

const ACTIVITY_DAYS = 30;

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
    prereqs,
    { count: offersCount, error: offersErr },
    { count: claimsCount, error: claimsErr },
    { count: expiredOffersCount, error: expiredOffersErr },
    { count: lostClaimsCount, error: lostClaimsErr },
  ] = await Promise.all([
    fetchCustomerStandbyPrereqs(admin, customerId),
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

  if (offersErr) throw new Error("offers_count_failed");
  if (claimsErr) throw new Error("claims_count_failed");
  if (expiredOffersErr) throw new Error("expired_offers_count_failed");
  if (lostClaimsErr) throw new Error("lost_claims_count_failed");

  const prefs = prereqs.prefRows;
  const activePrefs = prefs.filter((p) => p.active);
  const pausedPrefs = prefs.filter((p) => !p.active);

  const distinctActiveBusinesses = new Set(activePrefs.map((p) => p.business_id)).size;

  const input = buildStandbyReadinessInputFromLoaded({
    customer: prereqs.customer,
    prefRows: prefs,
    pushDeviceCount: prereqs.pushDeviceCount,
    pushPermissionStatus: opts.pushPermissionStatus,
  });
  const readiness = computeCustomerStandbyReadiness(input);

  return {
    summary: {
      active_preferences: activePrefs.length,
      paused_preferences: pausedPrefs.length,
      businesses_covered: distinctActiveBusinesses,
      has_any_active_preference: activePrefs.length > 0,
    },
    notification_readiness: {
      push_permission_status: opts.pushPermissionStatus,
      has_push_device: input.hasPushDevice,
      has_email: input.hasEmail,
      has_sms: input.hasSms,
      has_any_reachable_channel: input.hasAnyReachableChannel,
    },
    recent_activity: {
      recent_offers: offersCount ?? 0,
      recent_claims: claimsCount ?? 0,
      recent_missed: (expiredOffersCount ?? 0) + (lostClaimsCount ?? 0),
      window_days: ACTIVITY_DAYS,
    },
    preferences: prefs.map((p: StandbyPreferenceRow) => {
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
    guidance: readiness.guidance,
  };
}
