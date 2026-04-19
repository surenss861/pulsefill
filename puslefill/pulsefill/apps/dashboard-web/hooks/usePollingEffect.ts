"use client";

import { useEffect } from "react";

/** Lightweight refresh for pilot dashboards — not a substitute for realtime subscriptions. */
export function usePollingEffect(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await callback();
    };

    const id = setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [callback, intervalMs, enabled]);
}
