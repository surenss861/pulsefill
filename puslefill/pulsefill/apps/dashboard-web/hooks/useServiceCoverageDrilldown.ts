"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ServiceCoverageDrilldownData } from "@/lib/service-coverage-drilldown-data";

function isSafeHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function parseSuggested(raw: unknown): ServiceCoverageDrilldownData["suggested_action"] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.label !== "string" || typeof o.href !== "string") return null;
  if (!isSafeHref(o.href)) return null;
  const key = typeof o.key === "string" ? o.key : "coverage_health";
  const pr = o.priority;
  if (pr !== "primary" && pr !== "secondary") return null;
  return { key, label: o.label, href: o.href, priority: pr };
}

function parseReasons(raw: unknown): ServiceCoverageDrilldownData["top_no_match_reasons"] {
  if (!Array.isArray(raw)) return [];
  const out: ServiceCoverageDrilldownData["top_no_match_reasons"] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.reason !== "string" || typeof o.count !== "number" || typeof o.label !== "string") continue;
    out.push({ reason: o.reason, count: o.count, label: o.label });
  }
  return out;
}

function parsePeriod(raw: unknown): ServiceCoverageDrilldownData["period"] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.days !== "number" || typeof o.label !== "string" || typeof o.start_at !== "string" || typeof o.end_at !== "string") {
    return null;
  }
  return { days: o.days, label: o.label, start_at: o.start_at, end_at: o.end_at };
}

function parsePayload(raw: unknown): ServiceCoverageDrilldownData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.service_id !== "string" || typeof o.service_name !== "string") return null;
  const period = parsePeriod(o.period);
  const suggested = parseSuggested(o.suggested_action);
  if (!period || !suggested) return null;
  const w = o.watching_customer_count;
  const r = o.reachable_customer_count;
  const ro = o.recent_openings_30d;
  const nm = o.no_match_events_30d;
  if (typeof w !== "number" || typeof r !== "number" || typeof ro !== "number" || typeof nm !== "number") return null;
  return {
    service_id: o.service_id,
    service_name: o.service_name,
    period,
    watching_customer_count: w,
    reachable_customer_count: r,
    recent_openings_30d: ro,
    no_match_events_30d: nm,
    top_no_match_reasons: parseReasons(o.top_no_match_reasons),
    suggested_action: suggested,
  };
}

async function fetchDrilldown(serviceId: string): Promise<{ data: ServiceCoverageDrilldownData | null; notFound: boolean }> {
  try {
    const raw = await apiFetch<unknown>(`/v1/businesses/mine/service-coverage/${serviceId}`);
    const parsed = parsePayload(raw);
    if (!parsed) {
      return { data: null, notFound: false };
    }
    return { data: parsed, notFound: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("404") || msg.toLowerCase().includes("not found") || msg.includes("service_not_found")) {
      return { data: null, notFound: true };
    }
    throw e;
  }
}

export function useServiceCoverageDrilldown(serviceId: string | undefined) {
  const [data, setData] = useState<ServiceCoverageDrilldownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!serviceId) {
      setData(null);
      setError(null);
      setNotFound(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const { data: next, notFound: nf } = await fetchDrilldown(serviceId);
      if (nf) {
        setNotFound(true);
        setData(null);
      } else if (!next) {
        setError("Unexpected service coverage response.");
        setData(null);
      } else {
        setData(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t load service coverage.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, notFound, reload: load };
}
