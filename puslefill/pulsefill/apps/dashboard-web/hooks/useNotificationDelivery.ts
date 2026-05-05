"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { NotificationDeliveryResponse } from "@/types/notification-delivery";

export function useNotificationDelivery(slotId: string | undefined) {
  const [data, setData] = useState<NotificationDeliveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!slotId) {
        setData(null);
        setLoading(false);
        return;
      }
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        setError(null);
        const body = await apiFetch<NotificationDeliveryResponse>(`/v1/open-slots/${slotId}/notification-delivery`);
        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load delivery status");
        setData(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [slotId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
