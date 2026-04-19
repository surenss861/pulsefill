"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SlotTimelineEvent } from "@/types/timeline";

export function useSlotTimeline(slotId: string | undefined) {
  const [events, setEvents] = useState<SlotTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!slotId) {
        setEvents([]);
        setLoading(false);
        return;
      }
      const silent = opts?.silent ?? false;
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);
        const data = await apiFetch<{ events: SlotTimelineEvent[] }>(`/v1/open-slots/${slotId}/timeline`);
        setEvents(data.events ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load timeline");
        setEvents([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [slotId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, reload: load };
}
