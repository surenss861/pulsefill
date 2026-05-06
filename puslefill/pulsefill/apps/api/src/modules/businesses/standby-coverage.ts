import type { SupabaseClient } from "@supabase/supabase-js";

export type StandbyCoverageServiceRow = {
  service_id: string;
  service_name: string;
  /** Distinct eligible customers who can match this service (wildcard prefs count for every service). */
  watching_customer_count: number;
};

export type StandbyCoverageActivityRow = {
  updated_at: string;
  active: boolean;
  customer_display: string;
  service_label: string;
  location_label: string;
};

export type StandbyCoverageResponse = {
  evaluated_at: string;
  active_preferences_count: number;
  /** Distinct customers with ≥1 active preference (may lack membership). */
  standby_customer_count: number;
  /** Distinct customers who can receive offers: active pref + active membership. */
  eligible_customer_count: number;
  /** Eligible customers with push, SMS, or email channel usable for notifications. */
  reachable_customer_count: number;
  unreachable_eligible_count: number;
  /** Distinct customers with active prefs but no active membership for this business. */
  customers_pending_membership: number;
  services: StandbyCoverageServiceRow[];
  /** Active services with zero eligible watchers. */
  uncovered_services: StandbyCoverageServiceRow[];
  /** Active services with 1 eligible watcher (thin for reliable matching). */
  thin_services: StandbyCoverageServiceRow[];
  recent_activity: StandbyCoverageActivityRow[];
};

type PrefRow = {
  customer_id: string;
  service_id: string | null;
  active: boolean;
};

export type StandbyCoveragePrefInput = {
  customer_id: string;
  /** When null, preference applies to every active service (wildcard). */
  service_id: string | null;
};

/**
 * Distinct eligible customers who would match `serviceId` given their preference rows
 * (already filtered to active prefs for the business). Wildcard `service_id` counts for every service.
 */
export function eligibleWatchingCustomerIdsForService(
  prefs: ReadonlyArray<StandbyCoveragePrefInput>,
  eligibleCustomerIds: ReadonlySet<string>,
  serviceId: string,
): string[] {
  const hit = new Set<string>();
  for (const p of prefs) {
    if (!eligibleCustomerIds.has(p.customer_id)) continue;
    if (!p.service_id || p.service_id === serviceId) {
      hit.add(p.customer_id);
    }
  }
  return Array.from(hit);
}

export function eligibleWatchingCustomerCountForService(
  prefs: ReadonlyArray<StandbyCoveragePrefInput>,
  eligibleCustomerIds: ReadonlySet<string>,
  serviceId: string,
): number {
  return eligibleWatchingCustomerIdsForService(prefs, eligibleCustomerIds, serviceId).length;
}

let buildStandbyCoverageTestDelegate:
  | null
  | ((admin: SupabaseClient, businessId: string) => Promise<StandbyCoverageResponse>) = null;

export function setBuildStandbyCoverageTestDelegate(
  delegate: ((admin: SupabaseClient, businessId: string) => Promise<StandbyCoverageResponse>) | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("standby coverage test delegate only when PULSEFILL_API_TEST=1");
  }
  buildStandbyCoverageTestDelegate = delegate;
}

/** How many of these customers have at least one usable notification channel (push with device, email, or SMS). */
export async function countReachableAmongCustomers(
  admin: SupabaseClient,
  customerIds: string[],
): Promise<number> {
  if (customerIds.length === 0) return 0;
  const [{ data: custRows, error: cErr }, { data: deviceRows, error: dErr }] = await Promise.all([
    admin.from("customers").select("id, push_enabled, email_enabled, sms_enabled").in("id", customerIds),
    admin
      .from("customer_push_devices")
      .select("customer_id")
      .in("customer_id", customerIds)
      .eq("active", true)
      .eq("platform", "ios")
      .eq("token_type", "apns"),
  ]);
  if (cErr || dErr) throw new Error("standby_coverage_reach_failed");

  const withDevice = new Set(
    (deviceRows ?? []).map((r) => String((r as { customer_id: string }).customer_id)),
  );

  let reachable = 0;
  for (const row of custRows ?? []) {
    const c = row as {
      id: string;
      push_enabled?: boolean | null;
      email_enabled?: boolean | null;
      sms_enabled?: boolean | null;
    };
    const emailOk = Boolean(c.email_enabled);
    const smsOk = Boolean(c.sms_enabled);
    const pushOk = Boolean(c.push_enabled) && withDevice.has(c.id);
    if (emailOk || smsOk || pushOk) reachable += 1;
  }
  return reachable;
}

function pickName(embed: unknown): string | null {
  if (!embed) return null;
  const o = Array.isArray(embed) ? embed[0] : embed;
  if (o && typeof o === "object" && "name" in o && typeof (o as { name: unknown }).name === "string") {
    const n = (o as { name: string }).name.trim();
    return n || null;
  }
  return null;
}

export async function buildStandbyCoverage(
  admin: SupabaseClient,
  businessId: string,
): Promise<StandbyCoverageResponse> {
  if (buildStandbyCoverageTestDelegate) {
    return buildStandbyCoverageTestDelegate(admin, businessId);
  }

  const evaluated_at = new Date().toISOString();

  const [{ data: svcRows, error: svcErr }, { data: prefRows, error: prefErr }] = await Promise.all([
    admin.from("services").select("id, name").eq("business_id", businessId).eq("active", true).order("name"),
    admin
      .from("standby_preferences")
      .select("customer_id, service_id, active")
      .eq("business_id", businessId)
      .eq("active", true),
  ]);

  if (svcErr) throw new Error("standby_coverage_services_failed");
  if (prefErr) throw new Error("standby_coverage_prefs_failed");

  const services = (svcRows ?? []) as { id: string; name: string }[];
  const prefs = (prefRows ?? []) as PrefRow[];

  const active_preferences_count = prefs.length;
  const prefCustomerIds = [...new Set(prefs.map((p) => p.customer_id))];
  const standby_customer_count = prefCustomerIds.length;

  let membershipSet = new Set<string>();
  if (prefCustomerIds.length > 0) {
    const { data: mems, error: memErr } = await admin
      .from("customer_business_memberships")
      .select("customer_id")
      .eq("business_id", businessId)
      .eq("status", "active")
      .in("customer_id", prefCustomerIds);
    if (memErr) throw new Error("standby_coverage_memberships_failed");
    membershipSet = new Set((mems ?? []).map((m: { customer_id: string }) => m.customer_id));
  }

  const eligibleIds = prefCustomerIds.filter((id) => membershipSet.has(id));
  const eligible_customer_count = eligibleIds.length;
  const customers_pending_membership = prefCustomerIds.filter((id) => !membershipSet.has(id)).length;

  const reachable_customer_count = await countReachableAmongCustomers(admin, eligibleIds);
  const unreachable_eligible_count = Math.max(0, eligible_customer_count - reachable_customer_count);

  const eligibleSet = new Set(eligibleIds);

  const serviceRows: StandbyCoverageServiceRow[] = services.map((s) => ({
    service_id: s.id,
    service_name: s.name,
    watching_customer_count: eligibleWatchingCustomerCountForService(prefs, eligibleSet, s.id),
  }));

  serviceRows.sort((a, b) => {
    if (a.watching_customer_count !== b.watching_customer_count) {
      return a.watching_customer_count - b.watching_customer_count;
    }
    return a.service_name.localeCompare(b.service_name);
  });

  const uncovered_services = serviceRows.filter((r) => r.watching_customer_count === 0);
  const thin_services = serviceRows.filter((r) => r.watching_customer_count === 1);

  const { data: recentRows, error: recentErr } = await admin
    .from("standby_preferences")
    .select(
      `
      updated_at,
      active,
      customers ( full_name ),
      services ( name ),
      locations ( name )
    `,
    )
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (recentErr) throw new Error("standby_coverage_recent_failed");

  const recent_activity: StandbyCoverageActivityRow[] = (recentRows ?? []).map((row) => {
    const r = row as {
      updated_at: string;
      active: boolean;
      customers?: { full_name?: string } | { full_name?: string }[] | null;
      services?: unknown;
      locations?: unknown;
    };
    const fn = (() => {
      const c = r.customers;
      const o = Array.isArray(c) ? c[0] : c;
      const n = o && typeof o === "object" && "full_name" in o ? String((o as { full_name?: string }).full_name ?? "").trim() : "";
      return n || "Customer";
    })();
    const svc = pickName(r.services);
    const loc = pickName(r.locations);
    return {
      updated_at: r.updated_at,
      active: Boolean(r.active),
      customer_display: fn,
      service_label: svc ?? "Any service",
      location_label: loc ?? "Any location",
    };
  });

  return {
    evaluated_at,
    active_preferences_count,
    standby_customer_count,
    eligible_customer_count,
    reachable_customer_count,
    unreachable_eligible_count,
    customers_pending_membership,
    services: serviceRows,
    uncovered_services,
    thin_services,
    recent_activity,
  };
}
