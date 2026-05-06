import type { SupabaseClient } from "@supabase/supabase-js";

export type OpenSlotCreateDefaultsCombo = {
  location_id: string;
  provider_id: string;
  service_id: string;
  label: string;
  last_used_at: string;
};

export type OpenSlotCreateDefaultsResponse = {
  recent_combinations: OpenSlotCreateDefaultsCombo[];
  defaults: {
    location_id: string | null;
    provider_id: string | null;
    service_id: string | null;
  };
  setup_warnings: string[];
};

type SlotRow = {
  location_id: string | null;
  provider_id: string | null;
  service_id: string | null;
  provider_name_snapshot: string | null;
  created_at: string;
  locations?: { name?: string } | { name?: string }[] | null;
  providers?: { name?: string } | { name?: string }[] | null;
  services?: { name?: string } | { name?: string }[] | null;
};

function embedName(embed: { name?: string } | { name?: string }[] | null | undefined): string | null {
  if (!embed) return null;
  const row = Array.isArray(embed) ? embed[0] : embed;
  const n = row?.name?.trim();
  return n || null;
}

/** Dedupe by (location, provider, service), keep first occurrence (most recent). Exported for tests. */
export function dedupeRecentSlotCombinations(rows: SlotRow[]): SlotRow[] {
  const seen = new Set<string>();
  const out: SlotRow[] = [];
  for (const r of rows) {
    const lid = r.location_id;
    const pid = r.provider_id;
    const sid = r.service_id;
    if (!lid || !pid || !sid) continue;
    const key = `${lid}|${pid}|${sid}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function comboLabel(row: SlotRow): string {
  const loc = embedName(row.locations as { name?: string } | null) ?? "Location";
  const prov = embedName(row.providers as { name?: string } | null) ?? row.provider_name_snapshot?.trim() ?? "Provider";
  const svc = embedName(row.services as { name?: string } | null) ?? "Service";
  return `${svc} · ${prov} · ${loc}`;
}

let openSlotCreateDefaultsTestDelegate:
  | null
  | ((admin: SupabaseClient, businessId: string) => Promise<OpenSlotCreateDefaultsResponse>) = null;

export function setOpenSlotCreateDefaultsTestDelegate(
  delegate: ((admin: SupabaseClient, businessId: string) => Promise<OpenSlotCreateDefaultsResponse>) | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("open slot create defaults test delegate only when PULSEFILL_API_TEST=1");
  }
  openSlotCreateDefaultsTestDelegate = delegate;
}

export async function buildOpenSlotCreateDefaults(
  admin: SupabaseClient,
  businessId: string,
): Promise<OpenSlotCreateDefaultsResponse> {
  if (openSlotCreateDefaultsTestDelegate) {
    return openSlotCreateDefaultsTestDelegate(admin, businessId);
  }

  const [locRes, provRes, svcRes, slotsRes] = await Promise.all([
    admin.from("locations").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    admin.from("providers").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true),
    admin.from("services").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true),
    admin
      .from("open_slots")
      .select(
        `
        location_id,
        provider_id,
        service_id,
        provider_name_snapshot,
        created_at,
        locations ( name ),
        providers ( name ),
        services ( name )
      `,
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (locRes.error || provRes.error || svcRes.error) {
    throw new Error("create_defaults_counts_failed");
  }
  if (slotsRes.error) {
    throw new Error("create_defaults_slots_failed");
  }

  const locCount = locRes.count ?? 0;
  const provCount = provRes.count ?? 0;
  const svcCount = svcRes.count ?? 0;

  const setup_warnings: string[] = [];
  if (locCount === 0) setup_warnings.push("Add at least one active location before openings can match.");
  if (provCount === 0) setup_warnings.push("Add at least one active provider.");
  if (svcCount === 0) setup_warnings.push("Add at least one active service.");

  let default_location_id: string | null = null;
  let default_provider_id: string | null = null;
  let default_service_id: string | null = null;

  if (locCount === 1) {
    const { data: onlyLoc, error: e1 } = await admin
      .from("locations")
      .select("id")
      .eq("business_id", businessId)
      .limit(1)
      .maybeSingle();
    if (!e1 && onlyLoc && typeof (onlyLoc as { id?: string }).id === "string") {
      default_location_id = (onlyLoc as { id: string }).id;
    }
  }
  if (provCount === 1) {
    const { data: onlyProv, error: e2 } = await admin
      .from("providers")
      .select("id")
      .eq("business_id", businessId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (!e2 && onlyProv && typeof (onlyProv as { id?: string }).id === "string") {
      default_provider_id = (onlyProv as { id: string }).id;
    }
  }
  if (svcCount === 1) {
    const { data: onlySvc, error: e3 } = await admin
      .from("services")
      .select("id")
      .eq("business_id", businessId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (!e3 && onlySvc && typeof (onlySvc as { id?: string }).id === "string") {
      default_service_id = (onlySvc as { id: string }).id;
    }
  }

  const rawRows = (slotsRes.data ?? []) as SlotRow[];
  const deduped = dedupeRecentSlotCombinations(rawRows).slice(0, 8);

  const recent_combinations: OpenSlotCreateDefaultsCombo[] = deduped.map((r) => ({
    location_id: r.location_id!,
    provider_id: r.provider_id!,
    service_id: r.service_id!,
    label: comboLabel(r),
    last_used_at: r.created_at,
  }));

  return {
    recent_combinations,
    defaults: {
      location_id: default_location_id,
      provider_id: default_provider_id,
      service_id: default_service_id,
    },
    setup_warnings,
  };
}
