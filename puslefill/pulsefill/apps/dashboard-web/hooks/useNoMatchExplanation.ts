"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type NoMatchExplanationBreakdownRow = {
  reason: string;
  count: number;
  label: string;
};

export type NoMatchExplanationGuidanceRow = {
  title: string;
  href: string;
};

export type NoMatchRetryAction = {
  key: string;
  label: string;
  href: string;
  priority: "primary" | "secondary";
  reason?: string;
};

export type NoMatchRetryGuidance = {
  headline: string;
  message: string;
  recommended_actions: NoMatchRetryAction[];
};

export type NoMatchExplanationSummary = {
  total_preferences_checked: number;
  matched: number;
  rejected: Partial<Record<string, number>>;
};

export type NoMatchExplanationPayload = {
  open_slot_id: string;
  has_explanation: boolean;
  source_observed_at: string | null;
  reason: string | null;
  headline: string;
  explanation: string;
  summary: NoMatchExplanationSummary | null;
  rejection_breakdown: NoMatchExplanationBreakdownRow[];
  guidance: NoMatchExplanationGuidanceRow[];
  retry_guidance: NoMatchRetryGuidance | null;
};

function parseBreakdown(raw: unknown): NoMatchExplanationBreakdownRow[] {
  if (!Array.isArray(raw)) return [];
  const out: NoMatchExplanationBreakdownRow[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.reason === "string" && typeof o.count === "number" && typeof o.label === "string") {
      out.push({ reason: o.reason, count: o.count, label: o.label });
    }
  }
  return out;
}

function isSafeInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function parseRetryGuidance(raw: unknown): NoMatchRetryGuidance | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.headline !== "string" || typeof o.message !== "string") return null;
  const ar = o.recommended_actions;
  if (!Array.isArray(ar)) return null;
  const recommended_actions: NoMatchRetryAction[] = [];
  for (const item of ar) {
    if (!item || typeof item !== "object") continue;
    const a = item as Record<string, unknown>;
    if (typeof a.key !== "string" || typeof a.label !== "string" || typeof a.href !== "string") continue;
    if (!isSafeInternalHref(a.href)) continue;
    const pr = a.priority;
    if (pr !== "primary" && pr !== "secondary") continue;
    const reason = typeof a.reason === "string" ? a.reason : undefined;
    recommended_actions.push({ key: a.key, label: a.label, href: a.href, priority: pr, reason });
  }
  if (recommended_actions.length === 0) return null;
  return { headline: o.headline, message: o.message, recommended_actions };
}

function parseGuidance(raw: unknown): NoMatchExplanationGuidanceRow[] {
  if (!Array.isArray(raw)) return [];
  const out: NoMatchExplanationGuidanceRow[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.title === "string" && typeof o.href === "string") {
      out.push({ title: o.title, href: o.href });
    }
  }
  return out;
}

function parseSummary(raw: unknown): NoMatchExplanationSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const t = o.total_preferences_checked;
  const m = o.matched;
  const rej = o.rejected;
  if (typeof t !== "number" || typeof m !== "number" || !rej || typeof rej !== "object") return null;
  return {
    total_preferences_checked: t,
    matched: m,
    rejected: rej as Partial<Record<string, number>>,
  };
}

function parsePayload(raw: unknown): NoMatchExplanationPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.open_slot_id !== "string") return null;
  return {
    open_slot_id: o.open_slot_id,
    has_explanation: o.has_explanation === true,
    source_observed_at: typeof o.source_observed_at === "string" ? o.source_observed_at : null,
    reason: typeof o.reason === "string" ? o.reason : null,
    headline: typeof o.headline === "string" ? o.headline : "No match details",
    explanation: typeof o.explanation === "string" ? o.explanation : "",
    summary: parseSummary(o.summary),
    rejection_breakdown: parseBreakdown(o.rejection_breakdown),
    guidance: parseGuidance(o.guidance),
    retry_guidance: parseRetryGuidance(o.retry_guidance),
  };
}

export function useNoMatchExplanation(slotId: string | undefined) {
  const [data, setData] = useState<NoMatchExplanationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slotId) {
      setData(null);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const raw = await apiFetch<unknown>(`/v1/open-slots/${slotId}/no-match-explanation`);
      setData(parsePayload(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t load no-match explanation");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slotId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
