"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { RecoveryInsightsData } from "@/lib/recovery-insights-data";

function isSafeHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function parseSuggestedFocus(raw: unknown): RecoveryInsightsData["suggested_focus"] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.headline !== "string" || typeof o.detail !== "string" || typeof o.href !== "string") return null;
  if (!isSafeHref(o.href)) return null;
  const key = typeof o.key === "string" ? o.key : "balanced";
  return { key, headline: o.headline, detail: o.detail, href: o.href };
}

function parseTopReasons(raw: unknown): RecoveryInsightsData["top_no_match_reasons"] {
  if (!Array.isArray(raw)) return [];
  const out: RecoveryInsightsData["top_no_match_reasons"] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.reason !== "string" || typeof o.count !== "number" || typeof o.label !== "string") continue;
    out.push({ reason: o.reason, count: o.count, label: o.label });
  }
  return out;
}

function parseThinServices(raw: unknown): RecoveryInsightsData["thin_services"] {
  if (!Array.isArray(raw)) return [];
  const out: RecoveryInsightsData["thin_services"] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (
      typeof o.service_id !== "string" ||
      typeof o.service_name !== "string" ||
      typeof o.no_match_count !== "number" ||
      typeof o.recovered_bookings_30d !== "number"
    ) {
      continue;
    }
    out.push({
      service_id: o.service_id,
      service_name: o.service_name,
      no_match_count: o.no_match_count,
      recovered_bookings_30d: o.recovered_bookings_30d,
    });
  }
  return out;
}

function parsePeriod(raw: unknown): RecoveryInsightsData["period"] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.days !== "number" || typeof o.label !== "string" || typeof o.start_at !== "string" || typeof o.end_at !== "string") {
    return null;
  }
  return { days: o.days, label: o.label, start_at: o.start_at, end_at: o.end_at };
}

function parsePayload(raw: unknown): RecoveryInsightsData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const period = parsePeriod(o.period);
  const suggested = parseSuggestedFocus(o.suggested_focus);
  if (!period || !suggested) return null;
  const recovered = o.recovered_count_30d;
  const missed = o.missed_count_30d;
  const nm = o.no_match_count_30d;
  const del = o.delivery_failure_count_30d;
  if (typeof recovered !== "number" || typeof missed !== "number" || typeof nm !== "number" || typeof del !== "number") {
    return null;
  }
  const avg = o.average_claim_confirmation_minutes;
  const average_claim_confirmation_minutes =
    avg === null ? null : typeof avg === "number" && Number.isFinite(avg) ? avg : null;

  return {
    period,
    recovered_count_30d: recovered,
    missed_count_30d: missed,
    no_match_count_30d: nm,
    top_no_match_reasons: parseTopReasons(o.top_no_match_reasons),
    thin_services: parseThinServices(o.thin_services),
    delivery_failure_count_30d: del,
    average_claim_confirmation_minutes,
    suggested_focus: suggested,
  };
}

export function useRecoveryInsights() {
  const [data, setData] = useState<RecoveryInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const raw = await apiFetch<unknown>("/v1/businesses/mine/recovery-insights");
      const parsed = parsePayload(raw);
      if (!parsed) {
        setError("Unexpected recovery insights response.");
        setData(null);
      } else {
        setData(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t load recovery insights.");
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
