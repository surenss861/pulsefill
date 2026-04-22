"use client";

import { useEffect } from "react";
import { getSupabaseRealtimeClient } from "@/lib/supabase-realtime";

const realtimeDebug = process.env.NEXT_PUBLIC_REALTIME_DEBUG === "true";

export function useClaimsRealtime(onSlotChanged: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let client: ReturnType<typeof getSupabaseRealtimeClient> | null = null;
    try {
      client = getSupabaseRealtimeClient();
    } catch {
      return;
    }

    let cancelled = false;

    const channel = client
      .channel("claims-open-slots")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "open_slots" },
        (_payload: unknown) => {
          if (realtimeDebug) {
            console.log("[PulseFill realtime] claims open_slots UPDATE", _payload);
          }
          if (!cancelled) onSlotChanged();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [onSlotChanged, enabled]);
}
