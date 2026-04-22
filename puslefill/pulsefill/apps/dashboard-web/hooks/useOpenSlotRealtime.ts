"use client";

import { useEffect } from "react";
import { getSupabaseRealtimeClient } from "@/lib/supabase-realtime";

const realtimeDebug = process.env.NEXT_PUBLIC_REALTIME_DEBUG === "true";

export function useOpenSlotRealtime(slotId: string | undefined, onChanged: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled || !slotId) return;

    let client: ReturnType<typeof getSupabaseRealtimeClient> | null = null;
    try {
      client = getSupabaseRealtimeClient();
    } catch {
      return;
    }

    let cancelled = false;

    const channel = client
      .channel(`open-slot-${slotId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "open_slots",
          filter: `id=eq.${slotId}`,
        },
        (_payload: unknown) => {
          if (realtimeDebug) {
            console.log("[PulseFill realtime] slot detail open_slots UPDATE", _payload);
          }
          if (!cancelled) onChanged();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [slotId, onChanged, enabled]);
}
