"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActionQueueResponse } from "@/types/action-queue";

/** Sidebar / badges: poll lightly for needs_action_count only. */
export function useNeedsAttentionCount(pollMs = 30_000) {
  const [count, setCount] = useState(0);

  const tick = useCallback(async () => {
    try {
      const res = await apiFetch<ActionQueueResponse>("/v1/businesses/mine/action-queue");
      setCount(res.summary.needs_action_count);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void tick();
  }, [tick]);

  useEffect(() => {
    if (pollMs <= 0) return;
    const id = setInterval(() => void tick(), pollMs);
    return () => clearInterval(id);
  }, [tick, pollMs]);

  return count;
}
