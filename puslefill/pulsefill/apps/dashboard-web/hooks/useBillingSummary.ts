"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { BillingSummaryResponse } from "@/types/billing";

const BILLING_SUMMARY = "/v1/billing/summary";

export function useBillingSummary() {
  const [data, setData] = useState<BillingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiFetch<BillingSummaryResponse>(BILLING_SUMMARY);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Couldn’t load billing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
