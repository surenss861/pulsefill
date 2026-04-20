"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { OpsBreakdownResponse } from "@/types/ops-breakdown";

export function useOpsBreakdown() {
  const [data, setData] = useState<OpsBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<OpsBreakdownResponse>("/v1/businesses/mine/ops-breakdown");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ops breakdown.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
