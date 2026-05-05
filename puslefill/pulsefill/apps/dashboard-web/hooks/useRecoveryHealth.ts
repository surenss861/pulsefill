"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { RecoveryHealthResponse } from "@/types/recovery-health";

export function useRecoveryHealth() {
  const [data, setData] = useState<RecoveryHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const next = await apiFetch<RecoveryHealthResponse>("/v1/businesses/mine/recovery-health");
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recovery health.");
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
