"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { NotificationAttemptRow } from "@/types/notification-attempt";

export function useNotificationAttempts(slotId: string | undefined) {
  const [attempts, setAttempts] = useState<NotificationAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!slotId) {
        setAttempts([]);
        setLoading(false);
        return;
      }
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        setError(null);
        const data = await apiFetch<{ items: NotificationAttemptRow[] }>(
          `/v1/businesses/mine/notification-attempts?open_slot_id=${encodeURIComponent(slotId)}&limit=20`,
        );
        setAttempts(data.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notification attempts");
        setAttempts([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [slotId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { attempts, loading, error, reload: load };
}
