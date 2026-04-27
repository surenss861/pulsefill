"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type StaffNamedRow = { id: string; name: string };

/** Service row with duration for inferring slot end from start. */
export type ServiceFormOption = { id: string; name: string; duration_minutes: number };

function mapNamed(rows: unknown): StaffNamedRow[] {
  if (!Array.isArray(rows)) return [];
  const out: StaffNamedRow[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.id === "string" && typeof o.name === "string") {
      out.push({ id: o.id, name: o.name });
    }
  }
  return out;
}

function mapServices(rows: unknown): ServiceFormOption[] {
  if (!Array.isArray(rows)) return [];
  const out: ServiceFormOption[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.id === "string" && typeof o.name === "string") {
      const dm = o.duration_minutes;
      const duration =
        typeof dm === "number" && Number.isFinite(dm) && dm >= 5 && dm <= 24 * 60 ? dm : 60;
      out.push({ id: o.id, name: o.name, duration_minutes: duration });
    }
  }
  return out;
}

export function useSlotFormOptions() {
  const [locations, setLocations] = useState<StaffNamedRow[]>([]);
  const [providers, setProviders] = useState<StaffNamedRow[]>([]);
  const [services, setServices] = useState<ServiceFormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [loc, prov, serv] = await Promise.all([
        apiFetch<unknown>("/v1/locations"),
        apiFetch<unknown>("/v1/providers"),
        apiFetch<unknown>("/v1/services"),
      ]);
      setLocations(mapNamed(loc));
      setProviders(mapNamed(prov));
      setServices(mapServices(serv));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load options");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { locations, providers, services, loading, error, reload: load };
}
