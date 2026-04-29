"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function usePendingStandbyRequests(pollMs = 60_000) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await apiFetch<{ requests: unknown[] }>("/v1/businesses/mine/customer-standby-requests?status=pending");
      const n = Array.isArray(data.requests) ? data.requests.length : 0;
      setCount(n);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load standby requests");
        setCount(0);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (pollMs <= 0) return;
    const id = setInterval(() => void load(true), pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    await load(opts?.silent ?? false);
  }, [load]);

  return { count, loading, error, reload };
}
