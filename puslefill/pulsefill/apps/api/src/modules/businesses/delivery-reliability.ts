import type { SupabaseClient } from "@supabase/supabase-js";

export type DeliveryReliabilityResponse = {
  date: string;
  timezone: string;
  summary: {
    delivered_today: number;
    failed_today: number;
    simulated_today: number;
    customers_with_push_ready: number;
    customers_with_no_push_device: number;
    customers_with_no_reachable_channel: number;
  };
  highlights: {
    top_failure_reason: string | null;
    customers_with_repeated_failures: number;
    slots_affected_today: number;
  };
};

type DayWindowRow = {
  calendar_date: string;
  start_utc: string;
  end_utc: string;
};

async function collectBusinessCustomerIds(
  admin: SupabaseClient,
  businessId: string,
  slotIds: string[],
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: prefs } = await admin.from("standby_preferences").select("customer_id").eq("business_id", businessId);
  for (const r of prefs ?? []) {
    const id = (r as { customer_id: string }).customer_id;
    if (id) ids.add(id);
  }

  if (slotIds.length > 0) {
    const [{ data: claims }, { data: offers }] = await Promise.all([
      admin.from("slot_claims").select("customer_id").in("open_slot_id", slotIds),
      admin.from("slot_offers").select("customer_id").in("open_slot_id", slotIds),
    ]);
    for (const r of claims ?? []) {
      const id = (r as { customer_id: string }).customer_id;
      if (id) ids.add(id);
    }
    for (const r of offers ?? []) {
      const id = (r as { customer_id: string }).customer_id;
      if (id) ids.add(id);
    }
  }

  return Array.from(ids);
}

export async function buildDeliveryReliability(
  admin: SupabaseClient,
  businessId: string,
): Promise<DeliveryReliabilityResponse> {
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

  const { data: slotRows } = await admin.from("open_slots").select("id").eq("business_id", businessId);
  const slotIds = (slotRows ?? []).map((r) => (r as { id: string }).id);

  let delivered_today = 0;
  let failed_today = 0;
  let simulated_today = 0;
  const failureReasons: string[] = [];
  const failedSlotIds = new Set<string>();

  if (slotIds.length > 0) {
    const { data: logs } = await admin
      .from("notification_logs")
      .select("status, error, open_slot_id, customer_id")
      .in("open_slot_id", slotIds)
      .gte("created_at", startUtc)
      .lt("created_at", endUtc);

    for (const row of logs ?? []) {
      const st = String((row as { status: string }).status || "").toLowerCase();
      if (st === "delivered") delivered_today += 1;
      else if (st === "failed") {
        failed_today += 1;
        const err = (row as { error?: string | null }).error;
        if (err && err.trim()) failureReasons.push(err.trim());
        const sid = (row as { open_slot_id: string | null }).open_slot_id;
        if (sid) failedSlotIds.add(sid);
      } else if (st === "simulated") simulated_today += 1;
    }
  }

  const reasonCounts = new Map<string, number>();
  for (const r of failureReasons) {
    reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
  }
  let top_failure_reason: string | null = null;
  let topN = 0;
  for (const [k, n] of reasonCounts) {
    if (n > topN) {
      topN = n;
      top_failure_reason = k;
    }
  }

  const businessCustomerIds = await collectBusinessCustomerIds(admin, businessId, slotIds);

  let customers_with_push_ready = 0;
  let customers_with_no_push_device = 0;
  let customers_with_no_reachable_channel = 0;

  if (businessCustomerIds.length > 0) {
    const { data: devices } = await admin
      .from("customer_push_devices")
      .select("customer_id")
      .eq("active", true)
      .in("customer_id", businessCustomerIds);

    const withDevice = new Set((devices ?? []).map((d) => (d as { customer_id: string }).customer_id));

    const { data: custRows } = await admin
      .from("customers")
      .select("id, email, phone, push_enabled, sms_enabled, email_enabled")
      .in("id", businessCustomerIds);

    for (const c of custRows ?? []) {
      const row = c as {
        id: string;
        email: string | null;
        phone: string | null;
        push_enabled: boolean;
        sms_enabled: boolean;
        email_enabled: boolean;
      };
      const hasDevice = withDevice.has(row.id);
      if (hasDevice && row.push_enabled) {
        customers_with_push_ready += 1;
      }
      if (!hasDevice) {
        customers_with_no_push_device += 1;
      }

      const emailReach = Boolean(row.email?.trim()) && row.email_enabled;
      const smsReach = Boolean(row.phone?.trim()) && row.sms_enabled;
      const pushReach = hasDevice && row.push_enabled;
      if (!emailReach && !smsReach && !pushReach) {
        customers_with_no_reachable_channel += 1;
      }
    }
  }

  /** Count customers with 2+ failed notification rows today (any slot). */
  const failCounts = new Map<string, number>();
  if (slotIds.length > 0) {
    const { data: failOnly } = await admin
      .from("notification_logs")
      .select("customer_id")
      .in("open_slot_id", slotIds)
      .eq("status", "failed")
      .gte("created_at", startUtc)
      .lt("created_at", endUtc);

    for (const row of failOnly ?? []) {
      const cid = (row as { customer_id: string | null }).customer_id;
      if (!cid) continue;
      failCounts.set(cid, (failCounts.get(cid) ?? 0) + 1);
    }
  }
  let repeatedFailures = 0;
  for (const n of failCounts.values()) {
    if (n >= 2) repeatedFailures += 1;
  }

  return {
    date: dateStr,
    timezone,
    summary: {
      delivered_today,
      failed_today,
      simulated_today,
      customers_with_push_ready,
      customers_with_no_push_device,
      customers_with_no_reachable_channel,
    },
    highlights: {
      top_failure_reason,
      customers_with_repeated_failures: repeatedFailures,
      slots_affected_today: failedSlotIds.size,
    },
  };
}
