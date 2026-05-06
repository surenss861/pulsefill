"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { CustomerTimelineResponse } from "@/types/customer-timeline";

export function useCustomerTimeline(customerId: string | undefined) {
  const [data, setData] = useState<CustomerTimelineResponse | null>(null);
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
      const res = await apiFetch<CustomerTimelineResponse>(`/v1/businesses/mine/customers/${customerId}/timeline`);
      setData({
        customer_id: res.customer_id,
        items: Array.isArray(res.items) ? res.items : [],
      });
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Could not load timeline.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
