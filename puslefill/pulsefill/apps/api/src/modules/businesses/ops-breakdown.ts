import type { SupabaseClient } from "@supabase/supabase-js";

export type OpsBreakdownRow = {
  id: string;
  label: string;
  recovered_bookings: number;
  recovered_revenue_cents: number;
  awaiting_confirmation: number;
  active_offered_slots: number;
  delivery_failures: number;
  no_matches: number;
};

export type OpsBreakdownResponse = {
  date_range: {
    label: string;
    start_at: string;
    end_at: string;
  };
  providers: OpsBreakdownRow[];
  services: OpsBreakdownRow[];
  locations: OpsBreakdownRow[];
  highlights: {
    top_provider_by_recovered_bookings: string | null;
    top_service_by_no_matches: string | null;
    top_location_by_failures: string | null;
  };
};

type NamedRow = { id: string; name: string };

type SlotRow = {
  id: string;
  provider_id: string | null;
  service_id: string | null;
  location_id: string | null;
  status: string;
  estimated_value_cents?: number | null;
};

function emptyRow(id: string, label: string): OpsBreakdownRow {
  return {
    id,
    label,
    recovered_bookings: 0,
    recovered_revenue_cents: 0,
    awaiting_confirmation: 0,
    active_offered_slots: 0,
    delivery_failures: 0,
    no_matches: 0,
  };
}

function bumpProvider(
  map: Map<string, OpsBreakdownRow>,
  slot: SlotRow,
  fn: (row: OpsBreakdownRow) => void,
) {
  const pid = slot.provider_id ?? "__unassigned__";
  const row = map.get(pid);
  if (row) fn(row);
}

function bumpService(
  map: Map<string, OpsBreakdownRow>,
  slot: SlotRow,
  fn: (row: OpsBreakdownRow) => void,
) {
  const sid = slot.service_id ?? "__unassigned__";
  const row = map.get(sid);
  if (row) fn(row);
}

function bumpLocation(
  map: Map<string, OpsBreakdownRow>,
  slot: SlotRow,
  fn: (row: OpsBreakdownRow) => void,
) {
  const lid = slot.location_id ?? "__unassigned__";
  const row = map.get(lid);
  if (row) fn(row);
}

function topBy(rows: OpsBreakdownRow[], pick: (r: OpsBreakdownRow) => number, label: (r: OpsBreakdownRow) => string) {
  let best: OpsBreakdownRow | null = null;
  let bestV = -1;
  for (const r of rows) {
    const v = pick(r);
    if (v > bestV) {
      bestV = v;
      best = r;
    }
  }
  if (!best || bestV <= 0) return null;
  return label(best);
}

export async function buildOpsBreakdown(admin: SupabaseClient, businessId: string): Promise<OpsBreakdownResponse> {
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

  const win = windowRows[0] as { calendar_date: string; start_utc: string; end_utc: string };
  const startUtc = win.start_utc;
  const endUtc = win.end_utc;

  const [{ data: providerRows }, { data: serviceRows }, { data: locationRows }, { data: slotRows }] = await Promise.all([
    admin.from("providers").select("id, name").eq("business_id", businessId).order("name", { ascending: true }),
    admin.from("services").select("id, name").eq("business_id", businessId).order("name", { ascending: true }),
    admin.from("locations").select("id, name").eq("business_id", businessId).order("name", { ascending: true }),
    admin
      .from("open_slots")
      .select("id, provider_id, service_id, location_id, status, estimated_value_cents")
      .eq("business_id", businessId),
  ]);

  const providers = new Map<string, OpsBreakdownRow>();
  for (const p of (providerRows ?? []) as NamedRow[]) {
    providers.set(p.id, emptyRow(p.id, p.name));
  }
  providers.set("__unassigned__", emptyRow("__unassigned__", "Unassigned"));

  const services = new Map<string, OpsBreakdownRow>();
  for (const s of (serviceRows ?? []) as NamedRow[]) {
    services.set(s.id, emptyRow(s.id, s.name));
  }
  services.set("__unassigned__", emptyRow("__unassigned__", "Unassigned"));

  const locations = new Map<string, OpsBreakdownRow>();
  for (const l of (locationRows ?? []) as NamedRow[]) {
    locations.set(l.id, emptyRow(l.id, l.name));
  }
  locations.set("__unassigned__", emptyRow("__unassigned__", "Unassigned"));

  const slots = (slotRows ?? []) as SlotRow[];
  const slotById = new Map(slots.map((s) => [s.id, s]));

  for (const s of slots) {
    const st = String(s.status || "").toLowerCase();
    if (st === "claimed") {
      bumpProvider(providers, s, (r) => {
        r.awaiting_confirmation += 1;
      });
      bumpService(services, s, (r) => {
        r.awaiting_confirmation += 1;
      });
      bumpLocation(locations, s, (r) => {
        r.awaiting_confirmation += 1;
      });
    }
    if (st === "offered") {
      bumpProvider(providers, s, (r) => {
        r.active_offered_slots += 1;
      });
      bumpService(services, s, (r) => {
        r.active_offered_slots += 1;
      });
      bumpLocation(locations, s, (r) => {
        r.active_offered_slots += 1;
      });
    }
  }

  const slotIds = slots.map((s) => s.id);

  const [{ data: confirmedClaims }, { data: failLogs }, { data: noMatchEvents }] = await Promise.all([
    slotIds.length === 0
      ? Promise.resolve({ data: [] as unknown[] })
      : admin
          .from("slot_claims")
          .select("open_slot_id, confirmed_at")
          .in("open_slot_id", slotIds)
          .eq("status", "confirmed")
          .not("confirmed_at", "is", null)
          .gte("confirmed_at", startUtc)
          .lt("confirmed_at", endUtc),
    slotIds.length === 0
      ? Promise.resolve({ data: [] as unknown[] })
      : admin
          .from("notification_logs")
          .select("open_slot_id")
          .in("open_slot_id", slotIds)
          .eq("status", "failed")
          .gte("created_at", startUtc)
          .lt("created_at", endUtc),
    admin
      .from("audit_events")
      .select("entity_id")
      .eq("business_id", businessId)
      .eq("event_type", "offers_no_match")
      .gte("created_at", startUtc)
      .lt("created_at", endUtc),
  ]);

  for (const row of confirmedClaims ?? []) {
    const openSlotId = (row as { open_slot_id?: string }).open_slot_id;
    if (!openSlotId) continue;
    const slot = slotById.get(openSlotId);
    if (!slot) continue;
    const cents = slot.estimated_value_cents ?? 0;
    bumpProvider(providers, slot, (x) => {
      x.recovered_bookings += 1;
      x.recovered_revenue_cents += cents;
    });
    bumpService(services, slot, (x) => {
      x.recovered_bookings += 1;
      x.recovered_revenue_cents += cents;
    });
    bumpLocation(locations, slot, (x) => {
      x.recovered_bookings += 1;
      x.recovered_revenue_cents += cents;
    });
  }

  for (const row of failLogs ?? []) {
    const sid = (row as { open_slot_id: string | null }).open_slot_id;
    if (!sid) continue;
    const slot = slotById.get(sid);
    if (!slot) continue;
    bumpProvider(providers, slot, (r) => {
      r.delivery_failures += 1;
    });
    bumpService(services, slot, (r) => {
      r.delivery_failures += 1;
    });
    bumpLocation(locations, slot, (r) => {
      r.delivery_failures += 1;
    });
  }

  for (const row of noMatchEvents ?? []) {
    const eid = (row as { entity_id: string | null }).entity_id;
    if (!eid) continue;
    const slot = slotById.get(eid);
    if (!slot) continue;
    bumpProvider(providers, slot, (r) => {
      r.no_matches += 1;
    });
    bumpService(services, slot, (r) => {
      r.no_matches += 1;
    });
    bumpLocation(locations, slot, (r) => {
      r.no_matches += 1;
    });
  }

  const sumMetrics = (r: OpsBreakdownRow) =>
    r.recovered_bookings +
    r.recovered_revenue_cents +
    r.awaiting_confirmation +
    r.active_offered_slots +
    r.delivery_failures +
    r.no_matches;

  const providerList = Array.from(providers.values()).filter((r) => r.id !== "__unassigned__" || sumMetrics(r) > 0);
  const serviceList = Array.from(services.values()).filter((r) => r.id !== "__unassigned__" || sumMetrics(r) > 0);
  const locationList = Array.from(locations.values()).filter((r) => r.id !== "__unassigned__" || sumMetrics(r) > 0);

  const highlights = {
    top_provider_by_recovered_bookings: topBy(
      providerList,
      (r) => r.recovered_bookings,
      (r) => r.label,
    ),
    top_service_by_no_matches: topBy(serviceList, (r) => r.no_matches, (r) => r.label),
    top_location_by_failures: topBy(locationList, (r) => r.delivery_failures, (r) => r.label),
  };

  return {
    date_range: {
      label: "today",
      start_at: startUtc,
      end_at: endUtc,
    },
    providers: providerList.sort((a, b) => b.recovered_bookings - a.recovered_bookings),
    services: serviceList.sort((a, b) => b.no_matches - a.no_matches),
    locations: locationList.sort((a, b) => b.delivery_failures - a.delivery_failures),
    highlights,
  };
}
