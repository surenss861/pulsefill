"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LiveCountsResponse } from "@/types/live-counts";

export function useLiveCounts(pollMs = 30_000) {
  const [data, setData] = useState<LiveCountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const res = await apiFetch<LiveCountsResponse>("/v1/businesses/mine/live-counts");
      setData(res);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load live counts");
        setData(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (pollMs <= 0) return;
    const id = setInterval(() => void load(true), pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  const reload = useCallback((opts?: { silent?: boolean }) => load(opts?.silent ?? false), [load]);

  return {
    data,
    loading,
    error,
    reload,
    /** Sidebar badges — same numbers as `data.counts` when loaded. */
    open: data?.counts.open ?? 0,
    claimed: data?.counts.claimed ?? 0,
  };
}
