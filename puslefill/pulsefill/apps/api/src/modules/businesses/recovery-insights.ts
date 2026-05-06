import type { SupabaseClient } from "@supabase/supabase-js";

const PERIOD_DAYS = 30;

/** Staff-safe labels for coarse `no_matches_reason` codes stored on audit metadata. */
export const NO_MATCH_REASON_LABELS: Record<string, string> = {
  no_active_preferences: "No active standby preferences",
  no_matching_standby_customers: "No preferences matched this opening",
};

export type RecoveryInsightsTopReason = {
  reason: string;
  count: number;
  label: string;
};

export type RecoveryInsightsThinService = {
  service_id: string;
  service_name: string;
  no_match_count: number;
  recovered_bookings_30d: number;
};

export type RecoveryInsightsSuggestedFocus = {
  key: string;
  headline: string;
  detail: string;
  href: string;
};

export type RecoveryInsightsResponse = {
  period: { days: number; label: string; start_at: string; end_at: string };
  recovered_count_30d: number;
  missed_count_30d: number;
  no_match_count_30d: number;
  top_no_match_reasons: RecoveryInsightsTopReason[];
  thin_services: RecoveryInsightsThinService[];
  delivery_failure_count_30d: number;
  average_claim_confirmation_minutes: number | null;
  suggested_focus: RecoveryInsightsSuggestedFocus;
};

function reasonLabel(code: string): string {
  return NO_MATCH_REASON_LABELS[code] ?? "Other no-match pattern";
}

export function aggregateNoMatchReasons(rows: Array<{ metadata?: unknown }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const meta = row.metadata;
    if (!meta || typeof meta !== "object") continue;
    const raw = (meta as Record<string, unknown>).no_matches_reason;
    if (typeof raw !== "string" || !raw.trim()) continue;
    const code = raw.trim();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return counts;
}

export function topReasonsFromCounts(counts: Map<string, number>, limit = 5): RecoveryInsightsTopReason[] {
  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count, label: reasonLabel(reason) }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, limit);
}

export function computeSuggestedFocus(input: {
  recovered_count_30d: number;
  missed_count_30d: number;
  no_match_count_30d: number;
  delivery_failure_count_30d: number;
  top_no_match_reasons: RecoveryInsightsTopReason[];
  thin_services: RecoveryInsightsThinService[];
}): RecoveryInsightsSuggestedFocus {
  const top = input.top_no_match_reasons[0];
  const thin = input.thin_services[0];

  if (input.delivery_failure_count_30d >= 5) {
    return {
      key: "notification_reliability",
      headline: "Tighten notification delivery",
      detail: `${input.delivery_failure_count_30d} push failures in the last ${PERIOD_DAYS} days are shrinking offer reach.`,
      href: "/activity",
    };
  }

  if (top?.reason === "no_active_preferences" && top.count >= 3) {
    return {
      key: "standby_pool",
      headline: "Grow standby before pushing harder on openings",
      detail: "No-match runs often cite missing standby preferences — invite customers and finish setup.",
      href: "/customers#invite-customer",
    };
  }

  if (thin && thin.no_match_count >= 3 && thin.no_match_count >= (thin.recovered_bookings_30d + 1) * 2) {
    return {
      key: "service_coverage",
      headline: `Align coverage for “${thin.service_name}”`,
      detail: `${thin.no_match_count} no-matches vs ${thin.recovered_bookings_30d} recovered bookings on this service in the window.`,
      href: "/services",
    };
  }

  if (input.no_match_count_30d >= 8 && input.no_match_count_30d > input.recovered_count_30d * 2) {
    return {
      key: "matching_gap",
      headline: "No-match volume is outpacing recoveries",
      detail: "Review standby coverage and opening defaults so offers land on eligible demand.",
      href: "/customers",
    };
  }

  if (input.missed_count_30d >= 6 && input.missed_count_30d > input.recovered_count_30d) {
    return {
      key: "missed_volume",
      headline: "Missed openings are elevated",
      detail: "Compare expired or cancelled slots against your recovery playbook and queue hygiene.",
      href: "/open-slots",
    };
  }

  return {
    key: "balanced",
    headline: "Patterns look steady",
    detail: "Keep monitoring outcomes; PulseFill will highlight the next recurring bottleneck automatically.",
    href: "/outcomes",
  };
}

function minutesBetween(a: string, b: string): number | null {
  const t0 = new Date(a).getTime();
  const t1 = new Date(b).getTime();
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) return null;
  return (t1 - t0) / 60_000;
}

async function fetchOpenSlotsForIds<T extends Record<string, unknown>>(
  admin: SupabaseClient,
  businessId: string,
  ids: string[],
  select: string,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 120) {
    const slice = ids.slice(i, i + 120);
    if (slice.length === 0) continue;
    const { data, error } = await admin
      .from("open_slots")
      .select(select)
      .eq("business_id", businessId)
      .in("id", slice);
    if (error) throw new Error("recovery_insights_chunk_query_failed");
    out.push(...((data ?? []) as unknown as T[]));
  }
  return out;
}

export async function buildRecoveryInsights(
  admin: SupabaseClient,
  businessId: string,
): Promise<RecoveryInsightsResponse> {
  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const since = startAt.toISOString();
  const endIso = endAt.toISOString();

  const [
    { count: recoveredCount, error: recErr },
    { count: missedTouched, error: missErr },
    { count: missedLegacy, error: missLegacyErr },
    { count: noMatchCount, error: nmErr },
    { count: deliveryFailCount, error: delErr },
    { data: auditRows, error: auditErr },
    { data: claimRows, error: claimErr },
  ] = await Promise.all([
    admin
      .from("slot_claims")
      .select("id, open_slots!inner(business_id)", { count: "exact", head: true })
      .eq("status", "confirmed")
      .not("confirmed_at", "is", null)
      .gte("confirmed_at", since)
      .lte("confirmed_at", endIso)
      .eq("open_slots.business_id", businessId),
    admin
      .from("open_slots")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["expired", "cancelled"])
      .not("last_touched_at", "is", null)
      .gte("last_touched_at", since)
      .lte("last_touched_at", endIso),
    admin
      .from("open_slots")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["expired", "cancelled"])
      .is("last_touched_at", null)
      .gte("created_at", since)
      .lte("created_at", endIso),
    admin
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("event_type", "offers_no_match")
      .gte("created_at", since)
      .lte("created_at", endIso),
    admin
      .from("notification_logs")
      .select("id, open_slots!inner(business_id)", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", since)
      .lte("created_at", endIso)
      .eq("open_slots.business_id", businessId),
    admin
      .from("audit_events")
      .select("metadata")
      .eq("business_id", businessId)
      .eq("event_type", "offers_no_match")
      .gte("created_at", since)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false })
      .limit(4000),
    admin
      .from("slot_claims")
      .select(
        `
        claimed_at,
        confirmed_at,
        open_slots!inner (
          business_id,
          service_id,
          services ( name )
        )
      `,
      )
      .eq("status", "confirmed")
      .not("confirmed_at", "is", null)
      .gte("confirmed_at", since)
      .lte("confirmed_at", endIso)
      .eq("open_slots.business_id", businessId),
  ]);

  if (recErr || missErr || missLegacyErr || nmErr || delErr || auditErr || claimErr) {
    throw new Error("recovery_insights_query_failed");
  }

  const recovered_count_30d = recoveredCount ?? 0;
  const missed_count_30d = (missedTouched ?? 0) + (missedLegacy ?? 0);
  const no_match_count_30d = noMatchCount ?? 0;
  const delivery_failure_count_30d = deliveryFailCount ?? 0;

  const reasonCounts = aggregateNoMatchReasons((auditRows ?? []) as Array<{ metadata?: unknown }>);
  const top_no_match_reasons = topReasonsFromCounts(reasonCounts, 6);

  const recoveredByService = new Map<string, { name: string; count: number }>();
  let sumConfirmMinutes = 0;
  let nConfirmSamples = 0;
  for (const raw of claimRows ?? []) {
    const row = raw as {
      claimed_at?: string;
      confirmed_at?: string;
      open_slots?:
        | { service_id?: string | null; services?: { name?: string } | { name?: string }[] }
        | { service_id?: string | null; services?: { name?: string } | { name?: string }[] }[]
        | null;
    };
    const claimedAt = row.claimed_at;
    const confirmedAt = row.confirmed_at;
    if (typeof claimedAt === "string" && typeof confirmedAt === "string") {
      const m = minutesBetween(claimedAt, confirmedAt);
      if (m != null) {
        sumConfirmMinutes += m;
        nConfirmSamples += 1;
      }
    }
    const os = row.open_slots;
    const slot = os && Array.isArray(os) ? os[0] : os;
    const sid = slot?.service_id ?? "__unassigned__";
    const nameRaw = slot?.services;
    const name =
      Array.isArray(nameRaw) && nameRaw[0] && typeof nameRaw[0].name === "string"
        ? nameRaw[0].name
        : nameRaw && !Array.isArray(nameRaw) && typeof (nameRaw as { name?: string }).name === "string"
          ? (nameRaw as { name: string }).name
          : sid === "__unassigned__"
            ? "Unassigned"
            : "Service";
    const cur = recoveredByService.get(sid) ?? { name, count: 0 };
    cur.count += 1;
    recoveredByService.set(sid, cur);
  }

  const average_claim_confirmation_minutes =
    nConfirmSamples > 0 ? Math.round((sumConfirmMinutes / nConfirmSamples) * 10) / 10 : null;

  const { data: nmEntityRows, error: nmEntErr } = await admin
    .from("audit_events")
    .select("entity_id")
    .eq("business_id", businessId)
    .eq("event_type", "offers_no_match")
    .gte("created_at", since)
    .lte("created_at", endIso)
    .not("entity_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(4000);

  if (nmEntErr) {
    throw new Error("recovery_insights_no_match_entities_failed");
  }

  const entityIds = [
    ...new Set(
      (nmEntityRows ?? [])
        .map((r) => (r as { entity_id?: string | null }).entity_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  type SlotSvc = { id: string; service_id: string | null; services?: { name?: string } | { name?: string }[] };
  const slotRows: SlotSvc[] =
    entityIds.length === 0
      ? []
      : await fetchOpenSlotsForIds<SlotSvc>(admin, businessId, entityIds, "id, service_id, services ( name )");

  const noMatchByService = new Map<string, number>();
  for (const s of slotRows) {
    const sid = s.service_id ?? "__unassigned__";
    noMatchByService.set(sid, (noMatchByService.get(sid) ?? 0) + 1);
  }

  const thin_services: RecoveryInsightsThinService[] = Array.from(noMatchByService.entries())
    .map(([service_id, no_match_count]) => {
      const rec = recoveredByService.get(service_id);
      const slotSample = slotRows.find((r) => (r.service_id ?? "__unassigned__") === service_id);
      const nameFromSlot = slotSample?.services;
      const svcName =
        Array.isArray(nameFromSlot) && nameFromSlot[0]?.name
          ? String(nameFromSlot[0].name)
          : nameFromSlot && !Array.isArray(nameFromSlot) && typeof (nameFromSlot as { name?: string }).name === "string"
            ? (nameFromSlot as { name: string }).name
            : rec?.name ?? (service_id === "__unassigned__" ? "Unassigned" : "Service");
      return {
        service_id,
        service_name: svcName,
        no_match_count,
        recovered_bookings_30d: rec?.count ?? 0,
      };
    })
    .filter((r) => r.no_match_count > 0)
    .sort((a, b) => b.no_match_count - a.no_match_count || a.service_name.localeCompare(b.service_name))
    .slice(0, 8);

  const suggested_focus = computeSuggestedFocus({
    recovered_count_30d,
    missed_count_30d,
    no_match_count_30d,
    delivery_failure_count_30d,
    top_no_match_reasons,
    thin_services,
  });

  return {
    period: {
      days: PERIOD_DAYS,
      label: `Last ${PERIOD_DAYS} days`,
      start_at: since,
      end_at: endIso,
    },
    recovered_count_30d,
    missed_count_30d,
    no_match_count_30d,
    top_no_match_reasons,
    thin_services,
    delivery_failure_count_30d,
    average_claim_confirmation_minutes,
    suggested_focus,
  };
}
