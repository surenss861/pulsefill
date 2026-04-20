import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStandbyGuidance, type StandbyGuidanceItem } from "./standby-guidance.js";

export type StandbyPreferenceRow = {
  id: string;
  business_id: string;
  active: boolean;
  max_notice_hours: number | null;
  updated_at: string;
  businesses: { name: string } | { name: string }[] | null;
  services: { name: string } | { name: string }[] | null;
  locations: { name: string } | { name: string }[] | null;
  providers: { name: string } | { name: string }[] | null;
};

export type CustomerStandbyReadinessInput = {
  activePreferences: number;
  pausedPreferences: number;
  hasPushDevice: boolean;
  pushPermissionStatus: string;
  pushEnabled: boolean;
  hasEmail: boolean;
  hasSms: boolean;
  hasAnyReachableChannel: boolean;
};

export type CustomerStandbyReadiness = CustomerStandbyReadinessInput & {
  shouldSuggestSetup: boolean;
  shouldRemindStatus: boolean;
  guidance: StandbyGuidanceItem[];
};

export function buildStandbyReadinessInputFromLoaded(args: {
  customer: {
    email: string | null;
    phone: string | null;
    push_enabled: boolean | null;
    sms_enabled: boolean | null;
    email_enabled: boolean | null;
  } | null;
  prefRows: StandbyPreferenceRow[];
  pushDeviceCount: number;
  pushPermissionStatus: string;
}): CustomerStandbyReadinessInput {
  const activePrefs = args.prefRows.filter((p) => p.active);
  const pausedPrefs = args.prefRows.filter((p) => !p.active);

  const email = (args.customer?.email ?? "").trim();
  const phone = (args.customer?.phone ?? "").trim();
  const pushEnabled = Boolean(args.customer?.push_enabled ?? true);
  const smsEnabled = Boolean(args.customer?.sms_enabled ?? false);
  const emailEnabled = Boolean(args.customer?.email_enabled ?? true);

  const hasEmail = email.length > 0;
  const hasSmsChannel = phone.length > 0;
  const hasSms = hasSmsChannel && smsEnabled;

  const hasPushDevice = args.pushDeviceCount > 0;
  const pushPermissionStatus = args.pushPermissionStatus;

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

  return {
    activePreferences: activePrefs.length,
    pausedPreferences: pausedPrefs.length,
    hasPushDevice,
    pushPermissionStatus,
    pushEnabled,
    hasEmail,
    hasSms,
    hasAnyReachableChannel,
  };
}

export function computeCustomerStandbyReadiness(input: CustomerStandbyReadinessInput): CustomerStandbyReadiness {
  const guidance = buildStandbyGuidance(input);

  const shouldSuggestSetup =
    input.activePreferences === 0 ||
    !input.hasAnyReachableChannel ||
    input.pushPermissionStatus === "denied";

  const shouldRemindStatus =
    input.activePreferences > 0 &&
    input.pushPermissionStatus !== "denied" &&
    input.pushEnabled &&
    !input.hasPushDevice &&
    input.hasAnyReachableChannel;

  return {
    ...input,
    shouldSuggestSetup,
    shouldRemindStatus,
    guidance,
  };
}

/** Shared customer + preferences + push device count for readiness (activity feed + standby status). */
export async function fetchCustomerStandbyPrereqs(
  admin: SupabaseClient,
  customerId: string,
): Promise<{
  customer: {
    email: string | null;
    phone: string | null;
    push_enabled: boolean | null;
    sms_enabled: boolean | null;
    email_enabled: boolean | null;
    created_at: string;
  } | null;
  prefRows: StandbyPreferenceRow[];
  pushDeviceCount: number;
  notificationPrefsUpdatedAt: string | null;
}> {
  const [{ data: customer, error: customerErr }, { data: prefRows, error: prefErr }, { count: pushDeviceCount, error: pushErr }, { data: notifPref }] =
    await Promise.all([
      admin
        .from("customers")
        .select("email, phone, push_enabled, sms_enabled, email_enabled, created_at")
        .eq("id", customerId)
        .maybeSingle(),
      admin
        .from("standby_preferences")
        .select(
          `
        id,
        business_id,
        active,
        max_notice_hours,
        updated_at,
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
      admin.from("customer_notification_preferences").select("updated_at").eq("customer_id", customerId).maybeSingle(),
    ]);

  if (customerErr) throw new Error("customer_load_failed");
  if (prefErr) throw new Error("preferences_load_failed");
  if (pushErr) throw new Error("push_devices_failed");

  const np = notifPref as { updated_at?: string } | null;
  const cust = customer as {
    email: string | null;
    phone: string | null;
    push_enabled: boolean | null;
    sms_enabled: boolean | null;
    email_enabled: boolean | null;
    created_at: string;
  } | null;

  return {
    customer: cust,
    prefRows: (prefRows ?? []) as StandbyPreferenceRow[],
    pushDeviceCount: pushDeviceCount ?? 0,
    notificationPrefsUpdatedAt: np?.updated_at ?? null,
  };
}

export function latestStandbyTouchIso(args: {
  prefRows: StandbyPreferenceRow[];
  notificationPrefsUpdatedAt: string | null;
  customerCreatedAt: string | null;
}): string {
  const candidates: string[] = [];
  if (args.notificationPrefsUpdatedAt) candidates.push(args.notificationPrefsUpdatedAt);
  if (args.customerCreatedAt) candidates.push(args.customerCreatedAt);
  for (const p of args.prefRows) {
    if (p.updated_at) candidates.push(p.updated_at);
  }
  if (candidates.length === 0) return new Date().toISOString();
  return candidates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).at(-1)!;
}
