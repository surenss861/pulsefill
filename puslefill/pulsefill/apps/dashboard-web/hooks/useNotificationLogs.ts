"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { NotificationLogRow } from "@/types/notification-log";

export function useNotificationLogs(slotId: string | undefined) {
  const [logs, setLogs] = useState<NotificationLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!slotId) {
        setLogs([]);
        setLoading(false);
        return;
      }
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        setError(null);
        const data = await apiFetch<{ logs: NotificationLogRow[] }>(
          `/v1/open-slots/${slotId}/notification-logs`,
        );
        setLogs(data.logs ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notification logs");
        setLogs([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [slotId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { logs, loading, error, reload: load };
}
