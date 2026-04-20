"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { OperatorCustomerContextResponse } from "@/types/operator-customer-context";

export function useOperatorCustomerContext(customerId: string | undefined) {
  const [data, setData] = useState<OperatorCustomerContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<OperatorCustomerContextResponse>(
        `/v1/businesses/mine/customers/${customerId}/context`,
      );
      setData(res);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load customer context.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
