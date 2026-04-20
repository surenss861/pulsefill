import type { SupabaseClient } from "@supabase/supabase-js";

export type DailyOpsSummaryResponse = {
  date: string;
  timezone: string;
  metrics: {
    recovered_bookings_today: number;
    recovered_revenue_cents_today: number;
    awaiting_confirmation_count: number;
    delivery_failures_today: number;
    no_matches_today: number;
    active_offered_slots_count: number;
  };
  breakdown: {
    by_status: Record<string, number>;
  };
};

type DayWindowRow = {
  calendar_date: string;
  start_utc: string;
  end_utc: string;
};

export async function buildDailyOpsSummary(
  admin: SupabaseClient,
  businessId: string,
): Promise<DailyOpsSummaryResponse> {
  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("timezone")
    .eq("id", businessId)
    .maybeSingle();

  if (bizErr || !biz) {
    throw new Error("business_load_failed");
  }

  const timezone = (biz as { timezone: string }).timezone || "America/New_York";

  const { data: windowRows, error: wErr } = await admin.rpc("business_day_window_utc", {
    p_timezone: timezone,
    p_at: new Date().toISOString(),
  });

  if (wErr || !windowRows?.length) {
    throw new Error("day_window_failed");
  }

  const win = windowRows[0] as DayWindowRow;
  const startUtc = win.start_utc;
  const endUtc = win.end_utc;
  const dateStr = win.calendar_date;

  const [statusRows, awaitingRow, offeredRow, noMatchRow, bizSlotIds] = await Promise.all([
    admin.from("open_slots").select("status").eq("business_id", businessId),
    admin
      .from("open_slots")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "claimed"),
    admin
      .from("open_slots")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "offered"),
    admin
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("event_type", "offers_no_match")
      .gte("created_at", startUtc)
      .lt("created_at", endUtc),
    admin.from("open_slots").select("id").eq("business_id", businessId),
  ]);

  const slotIdList = (bizSlotIds.data ?? []).map((r) => (r as { id: string }).id);

  let delivery_failures_today = 0;
  let recovered_bookings_today = 0;
  let recovered_revenue_cents_today = 0;

  if (slotIdList.length > 0) {
    const [{ count: failCount }, { data: confirmedClaims }] = await Promise.all([
      admin
        .from("notification_logs")
        .select("id", { count: "exact", head: true })
        .in("open_slot_id", slotIdList)
        .eq("status", "failed")
        .gte("created_at", startUtc)
        .lt("created_at", endUtc),
      admin
        .from("slot_claims")
        .select(
          `
        open_slot_id,
        open_slots!inner (
          estimated_value_cents
        )
      `,
        )
        .in("open_slot_id", slotIdList)
        .eq("status", "confirmed")
        .not("confirmed_at", "is", null)
        .gte("confirmed_at", startUtc)
        .lt("confirmed_at", endUtc),
    ]);

    delivery_failures_today = failCount ?? 0;

    for (const row of confirmedClaims ?? []) {
      recovered_bookings_today += 1;
      const os = (row as { open_slots?: { estimated_value_cents?: number | null } }).open_slots;
      const slot = Array.isArray(os) ? os[0] : os;
      recovered_revenue_cents_today += slot?.estimated_value_cents ?? 0;
    }
  }

  const byStatus: {
    open: number;
    offered: number;
    claimed: number;
    booked: number;
    expired: number;
    cancelled: number;
  } = {
    open: 0,
    offered: 0,
    claimed: 0,
    booked: 0,
    expired: 0,
    cancelled: 0,
  };

  for (const row of statusRows.data ?? []) {
    const k = String((row as { status: string }).status || "").toLowerCase();
    switch (k) {
      case "open":
        byStatus.open += 1;
        break;
      case "offered":
        byStatus.offered += 1;
        break;
      case "claimed":
        byStatus.claimed += 1;
        break;
      case "booked":
        byStatus.booked += 1;
        break;
      case "expired":
        byStatus.expired += 1;
        break;
      case "cancelled":
        byStatus.cancelled += 1;
        break;
      default:
        break;
    }
  }

  return {
    date: dateStr,
    timezone,
    metrics: {
      recovered_bookings_today,
      recovered_revenue_cents_today,
      awaiting_confirmation_count: awaitingRow.count ?? 0,
      delivery_failures_today,
      no_matches_today: noMatchRow.count ?? 0,
      active_offered_slots_count: offeredRow.count ?? 0,
    },
    breakdown: {
      by_status: byStatus,
    },
  };
}
