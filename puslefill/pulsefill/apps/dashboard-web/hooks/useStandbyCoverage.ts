"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type StandbyCoverageServiceRow = {
  service_id: string;
  service_name: string;
  watching_customer_count: number;
};

export type StandbyCoverageActivityRow = {
  updated_at: string;
  active: boolean;
  customer_display: string;
  service_label: string;
  location_label: string;
};

export type StandbyCoveragePayload = {
  evaluated_at: string;
  active_preferences_count: number;
  standby_customer_count: number;
  eligible_customer_count: number;
  reachable_customer_count: number;
  unreachable_eligible_count: number;
  customers_pending_membership: number;
  services: StandbyCoverageServiceRow[];
  uncovered_services: StandbyCoverageServiceRow[];
  thin_services: StandbyCoverageServiceRow[];
  recent_activity: StandbyCoverageActivityRow[];
};

function parseServiceRow(raw: unknown): StandbyCoverageServiceRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.service_id === "string" &&
    typeof o.service_name === "string" &&
    typeof o.watching_customer_count === "number" &&
    Number.isFinite(o.watching_customer_count)
  ) {
    return {
      service_id: o.service_id,
      service_name: o.service_name,
      watching_customer_count: o.watching_customer_count,
    };
  }
  return null;
}

function parseActivityRow(raw: unknown): StandbyCoverageActivityRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.updated_at === "string" &&
    typeof o.customer_display === "string" &&
    typeof o.service_label === "string" &&
    typeof o.location_label === "string"
  ) {
    return {
      updated_at: o.updated_at,
      active: o.active === true,
      customer_display: o.customer_display,
      service_label: o.service_label,
      location_label: o.location_label,
    };
  }
  return null;
}

function parsePayload(raw: unknown): StandbyCoveragePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const services = Array.isArray(o.services) ? o.services.map(parseServiceRow).filter(Boolean) as StandbyCoverageServiceRow[] : [];
  const uncovered = Array.isArray(o.uncovered_services)
    ? o.uncovered_services.map(parseServiceRow).filter(Boolean) as StandbyCoverageServiceRow[]
    : [];
  const thin = Array.isArray(o.thin_services)
    ? o.thin_services.map(parseServiceRow).filter(Boolean) as StandbyCoverageServiceRow[]
    : [];
  const recent = Array.isArray(o.recent_activity)
    ? o.recent_activity.map(parseActivityRow).filter(Boolean) as StandbyCoverageActivityRow[]
    : [];
  const n = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : 0);
  const evaluated_at = typeof o.evaluated_at === "string" ? o.evaluated_at : "";
  if (!evaluated_at) return null;
  return {
    evaluated_at,
    active_preferences_count: n("active_preferences_count"),
    standby_customer_count: n("standby_customer_count"),
    eligible_customer_count: n("eligible_customer_count"),
    reachable_customer_count: n("reachable_customer_count"),
    unreachable_eligible_count: n("unreachable_eligible_count"),
    customers_pending_membership: n("customers_pending_membership"),
    services,
    uncovered_services: uncovered,
    thin_services: thin,
    recent_activity: recent,
  };
}

export function useStandbyCoverage() {
  const [data, setData] = useState<StandbyCoveragePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await apiFetch<unknown>("/v1/businesses/mine/standby-coverage");
      const parsed = parsePayload(raw);
      setData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t load standby coverage");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
