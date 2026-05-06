import type { SupabaseClient } from "@supabase/supabase-js";

import { rejectionLabelForReason } from "../slots/no-match-explanation.js";
import { aggregateNoMatchReasons, topReasonsFromCounts } from "./recovery-insights.js";
import {
  countReachableAmongCustomers,
  eligibleWatchingCustomerIdsForService,
  type StandbyCoveragePrefInput,
} from "./standby-coverage.js";

const WINDOW_DAYS = 30;

export type ServiceCoverageDrilldownReasonRow = {
  reason: string;
  count: number;
  label: string;
};

export type ServiceCoverageDrilldownSuggestedAction = {
  key: string;
  label: string;
  href: string;
  priority: "primary" | "secondary";
};

export type ServiceCoverageDrilldownResponse = {
  service_id: string;
  service_name: string;
  period: { days: number; label: string; start_at: string; end_at: string };
  /** Eligible standby customers whose preferences include this service (or wildcard). */
  watching_customer_count: number;
  /** Among watchers, customers with a reachable notification channel. */
  reachable_customer_count: number;
  /** Open slots for this service created in the rolling window. */
  recent_openings_30d: number;
  /** No-match audit rows in the window for openings tied to this service (capped by recent slot sample). */
  no_match_events_30d: number;
  top_no_match_reasons: ServiceCoverageDrilldownReasonRow[];
  suggested_action: ServiceCoverageDrilldownSuggestedAction;
};

export function computeServiceCoverageSuggestedAction(input: {
  watching: number;
  reachable: number;
  topReason?: { reason: string; count: number };
}): ServiceCoverageDrilldownSuggestedAction {
  const { watching, reachable, topReason } = input;

  if (watching === 0) {
    return {
      key: "invite_watchers",
      label: "Invite customers for this service",
      href: "/customers#invite-customer",
      priority: "primary",
    };
  }

  if (reachable === 0) {
    return {
      key: "reachability",
      label: "Review standby reachability",
      href: "/customers",
      priority: "primary",
    };
  }

  if (watching === 1) {
    return {
      key: "grow_pool",
      label: "Add more standby for this service",
      href: "/customers#invite-customer",
      priority: "primary",
    };
  }

  if (topReason?.reason === "notice_window_mismatch") {
    return {
      key: "notice",
      label: "Review opening notice windows",
      href: "/open-slots",
      priority: "primary",
    };
  }

  if (
    topReason &&
    (topReason.reason === "outside_availability_days" || topReason.reason === "outside_availability_time")
  ) {
    return {
      key: "availability",
      label: "Check customer availability vs openings",
      href: "/customers",
      priority: "primary",
    };
  }

  if (topReason?.reason === "no_active_preferences") {
    return {
      key: "standby_prefs",
      label: "Turn on standby preferences",
      href: "/customers",
      priority: "primary",
    };
  }

  return {
    key: "coverage_health",
    label: "Review service in catalog",
    href: "/services",
    priority: "secondary",
  };
}

export async function buildServiceCoverageDrilldown(
  admin: SupabaseClient,
  businessId: string,
  serviceId: string,
): Promise<ServiceCoverageDrilldownResponse> {
  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const since = startAt.toISOString();
  const endIso = endAt.toISOString();

  const { data: svc, error: svcErr } = await admin
    .from("services")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("id", serviceId)
    .maybeSingle();

  if (svcErr) throw new Error("service_coverage_drilldown_load_failed");
  if (!svc || typeof (svc as { name?: string }).name !== "string") {
    throw new Error("service_not_found");
  }

  const service_name = (svc as { name: string }).name;

  const [{ data: prefRows, error: prefErr }, { data: slotRows, error: slotErr }, { count: openingCount, error: openErr }] =
    await Promise.all([
      admin
        .from("standby_preferences")
        .select("customer_id, service_id, active")
        .eq("business_id", businessId)
        .eq("active", true),
      admin
        .from("open_slots")
        .select("id")
        .eq("business_id", businessId)
        .eq("service_id", serviceId)
        .gte("created_at", since)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(4000),
      admin
        .from("open_slots")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("service_id", serviceId)
        .gte("created_at", since)
        .lte("created_at", endIso),
    ]);

  if (prefErr || slotErr || openErr) {
    throw new Error("service_coverage_drilldown_query_failed");
  }

  const prefs = (prefRows ?? []) as { customer_id: string; service_id: string | null; active: boolean }[];
  const prefInput: StandbyCoveragePrefInput[] = prefs.map((p) => ({
    customer_id: p.customer_id,
    service_id: p.service_id,
  }));

  const prefCustomerIds = [...new Set(prefs.map((p) => p.customer_id))];
  let membershipSet = new Set<string>();
  if (prefCustomerIds.length > 0) {
    const { data: mems, error: memErr } = await admin
      .from("customer_business_memberships")
      .select("customer_id")
      .eq("business_id", businessId)
      .eq("status", "active")
      .in("customer_id", prefCustomerIds);
    if (memErr) throw new Error("service_coverage_drilldown_memberships_failed");
    membershipSet = new Set((mems ?? []).map((m: { customer_id: string }) => m.customer_id));
  }

  const eligibleIds = prefCustomerIds.filter((id) => membershipSet.has(id));
  const eligibleSet = new Set(eligibleIds);

  const watcherIds = eligibleWatchingCustomerIdsForService(prefInput, eligibleSet, serviceId);
  const watching_customer_count = watcherIds.length;
  const reachable_customer_count = await countReachableAmongCustomers(admin, watcherIds);

  const slotIds = (slotRows ?? []).map((r) => (r as { id: string }).id).filter(Boolean);
  const recent_openings_30d = openingCount ?? 0;

  let auditRows: Array<{ metadata?: unknown }> = [];
  if (slotIds.length > 0) {
    const chunkSize = 180;
    for (let i = 0; i < slotIds.length; i += chunkSize) {
      const slice = slotIds.slice(i, i + chunkSize);
      const { data: rows, error: aErr } = await admin
        .from("audit_events")
        .select("metadata")
        .eq("business_id", businessId)
        .eq("event_type", "offers_no_match")
        .gte("created_at", since)
        .lte("created_at", endIso)
        .in("entity_id", slice);
      if (aErr) throw new Error("service_coverage_drilldown_audit_failed");
      auditRows.push(...((rows ?? []) as Array<{ metadata?: unknown }>));
    }
  }

  const reasonCounts = aggregateNoMatchReasons(auditRows);
  const top_no_match_reasons = topReasonsFromCounts(reasonCounts, 8).map((r) => ({
    reason: r.reason,
    count: r.count,
    label: rejectionLabelForReason(r.reason),
  }));
  const no_match_events_30d = auditRows.length;

  const suggested_action = computeServiceCoverageSuggestedAction({
    watching: watching_customer_count,
    reachable: reachable_customer_count,
    topReason: top_no_match_reasons[0],
  });

  return {
    service_id: serviceId,
    service_name,
    period: {
      days: WINDOW_DAYS,
      label: `Last ${WINDOW_DAYS} days`,
      start_at: since,
      end_at: endIso,
    },
    watching_customer_count,
    reachable_customer_count,
    recent_openings_30d,
    no_match_events_30d,
    top_no_match_reasons,
    suggested_action,
  };
}
