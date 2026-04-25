"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { OutcomesPageData } from "@/lib/outcomes-page-data";

type OutcomesApiPayload = OutcomesPageData & { windowLabel: string };

export function useOutcomesPage() {
  const [data, setData] = useState<OutcomesPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const payload = await apiFetch<OutcomesApiPayload>("/v1/businesses/mine/outcomes");
      const { windowLabel, ...rest } = payload;
      setData({ ...rest, windowLabel });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outcomes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}
