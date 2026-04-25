import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDailyOpsSummary } from "./daily-ops-summary.js";
import { buildOpsBreakdown } from "./ops-breakdown.js";

/** Mirrors dashboard `OutcomesPageData` (+ window label for hero). */
export type OutcomesPagePayload = {
  windowLabel: string;
  scorecards: {
    recoveredBookings: number;
    recoveredRevenue: string;
    recoveryRate: string;
    expiredUnfilled: number;
    deliveryFailures: number;
  };
  outcomeMix: Array<{
    label: string;
    value: number;
    emphasis: "primary" | "danger" | "default";
  }>;
  leaks: Array<{
    title: string;
    value: number;
    body: string;
    href: string;
    cta: string;
    emphasis: "primary" | "danger" | "default";
  }>;
  performanceRows: Array<{
    label: string;
    recovered: number;
    lost: number;
    rate: string;
  }>;
  recentRecovered: Array<{
    id: string;
    title: string;
    detail: string;
    outcome: string;
    href: string;
  }>;
  recentLost: Array<{
    id: string;
    title: string;
    detail: string;
    outcome: string;
    href: string;
  }>;
};

import {
  buildOutcomesLeaks,
  buildOutcomesMix,
  buildOutcomesPerformanceRows,
  buildOutcomesScorecards,
  formatOutcomesWindowLabel,
} from "./outcomes-data-trust.js";

function relName(x: unknown): string | null {
  if (!x) return null;
  if (Array.isArray(x)) {
    const first = x[0] as { name?: string } | undefined;
    return typeof first?.name === "string" ? first.name : null;
  }
  if (typeof x === "object" && "name" in x && typeof (x as { name: unknown }).name === "string") {
    return (x as { name: string }).name;
  }
  return null;
}

function formatSlotDetail(timezone: string, startsAt: string, locationName: string | null): string {
  const start = new Date(startsAt);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
  const loc = locationName?.trim();
  return [loc, `${dateStr} · ${timeStr}`].filter(Boolean).join(" · ");
}

function detailHref(openSlotId: string): string {
  return `/open-slots/${openSlotId}?from=outcomes`;
}

async function fetch30DaySlotMetrics(admin: SupabaseClient, businessId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [slots, booked] = await Promise.all([
    admin
      .from("open_slots")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", since),
    admin
      .from("open_slots")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "booked")
      .gte("created_at", since),
  ]);

  return {
    open_slots_created: slots.count ?? 0,
    slots_booked: booked.count ?? 0,
  };
}

export async function buildOutcomesPage(admin: SupabaseClient, businessId: string): Promise<OutcomesPagePayload> {
  const [daily, ops, metrics30] = await Promise.all([
    buildDailyOpsSummary(admin, businessId),
    buildOpsBreakdown(admin, businessId),
    fetch30DaySlotMetrics(admin, businessId),
  ]);

  const tz = daily.timezone;
  const byStatus = daily.breakdown?.by_status ?? {};
  const expired =
    typeof byStatus === "object" && byStatus !== null && "expired" in byStatus
      ? Number((byStatus as { expired?: number }).expired ?? 0)
      : 0;

  const m = daily.metrics;
  const windowLabel = formatOutcomesWindowLabel(daily.date);

  const scorecards = buildOutcomesScorecards({
    metrics: m,
    expiredUnfilled: expired,
    openSlotsCreated30d: metrics30.open_slots_created,
    slotsBooked30d: metrics30.slots_booked,
  });

  const outcomeMix: OutcomesPagePayload["outcomeMix"] = buildOutcomesMix(m, expired);
  const leaks: OutcomesPagePayload["leaks"] = buildOutcomesLeaks(m);

  const locRows = ops.locations ?? [];
  const performanceRows: OutcomesPagePayload["performanceRows"] = buildOutcomesPerformanceRows(locRows);

  const [{ data: recoveredRows }, { data: lostRows }] = await Promise.all([
    admin
      .from("slot_claims")
      .select(
        `
        confirmed_at,
        open_slots!inner (
          id,
          business_id,
          starts_at,
          provider_name_snapshot,
          locations ( name ),
          services ( name )
        )
      `,
      )
      .eq("status", "confirmed")
      .not("confirmed_at", "is", null)
      .eq("open_slots.business_id", businessId)
      .order("confirmed_at", { ascending: false })
      .limit(5),
    admin
      .from("open_slots")
      .select("id, status, starts_at, provider_name_snapshot, locations ( name ), services ( name )")
      .eq("business_id", businessId)
      .in("status", ["expired", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  type NestedSlot = {
    id: string;
    starts_at: string;
    provider_name_snapshot: string | null;
    locations: unknown;
    services: unknown;
  };

  const recentRecovered: OutcomesPagePayload["recentRecovered"] = (recoveredRows ?? []).flatMap((raw) => {
    const row = raw as { open_slots: NestedSlot | NestedSlot[] };
    const slot = Array.isArray(row.open_slots) ? row.open_slots[0] : row.open_slots;
    if (!slot?.id) return [];
    const serviceName = relName(slot.services);
    const title = serviceName?.trim() || "Open slot";
    const detail = formatSlotDetail(tz, slot.starts_at, relName(slot.locations));
    return [
      {
        id: slot.id,
        title,
        detail,
        outcome: "Recovered",
        href: detailHref(slot.id),
      },
    ];
  });

  const recentLost: OutcomesPagePayload["recentLost"] = (lostRows ?? []).map((raw) => {
    const slot = raw as {
      id: string;
      status: string;
      starts_at: string;
      provider_name_snapshot: string | null;
      locations: unknown;
      services: unknown;
    };
    const serviceName = relName(slot.services);
    const title = serviceName?.trim() || "Open slot";
    const detail = formatSlotDetail(tz, slot.starts_at, relName(slot.locations));
    const st = (slot.status || "").toLowerCase();
    const outcome = st === "cancelled" ? "Cancelled" : "Expired unfilled";
    return {
      id: slot.id,
      title,
      detail,
      outcome,
      href: detailHref(slot.id),
    };
  });

  return {
    windowLabel,
    scorecards,
    outcomeMix,
    leaks,
    performanceRows,
    recentRecovered,
    recentLost,
  };
}
