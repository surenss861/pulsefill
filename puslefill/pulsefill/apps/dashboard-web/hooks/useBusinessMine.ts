"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { BusinessMineResponse } from "@/types/business-mine";

export function useBusinessMine() {
  const [data, setData] = useState<BusinessMineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const next = await apiFetch<BusinessMineResponse>("/v1/businesses/mine");
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace.");
      setData(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
