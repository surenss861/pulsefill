"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { usePollingEffect } from "@/hooks/usePollingEffect";

export type LiveCounts = {
  claimed: number;
  open: number;
};

export function useLiveCounts() {
  const [counts, setCounts] = useState<LiveCounts>({ claimed: 0, open: 0 });

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ counts: LiveCounts }>("/v1/businesses/mine/live-counts");
      setCounts(data.counts);
    } catch {
      // Keep last counts for unobtrusive nav badges
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  usePollingEffect(load, 15000, true);

  return counts;
}
