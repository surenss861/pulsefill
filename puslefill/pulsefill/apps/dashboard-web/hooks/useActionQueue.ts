"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActionQueueResponse } from "@/types/action-queue";

export function useActionQueue(pollMs = 15_000) {
  const [data, setData] = useState<ActionQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const res = await apiFetch<ActionQueueResponse>("/v1/businesses/mine/action-queue");
      setData(res);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Failed to load action queue");
      setData(null);
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

  const reload = useCallback(() => load(false), [load]);

  return { data, loading, error, reload };
}
