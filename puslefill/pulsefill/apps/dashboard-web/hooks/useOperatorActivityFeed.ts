"use client";

import { useCallback, useEffect, useState } from "react";
import { getOperatorActivityFeed } from "@/lib/operator-activity-feed";
import type { OperatorActivityItem } from "@/types/operator-activity-feed";

export function useOperatorActivityFeed(pollMs?: number) {
  const [items, setItems] = useState<OperatorActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const res = await getOperatorActivityFeed();
      setItems([...res.items].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload({ silent: false });
  }, [reload]);

  useEffect(() => {
    if (!pollMs) return;
    const t = setInterval(() => void reload({ silent: true }), pollMs);
    return () => clearInterval(t);
  }, [pollMs, reload]);

  return { items, loading, error, reload };
}
