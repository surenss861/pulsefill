"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { OpenSlotDetail } from "@/types/open-slot-detail";

export function useOpenSlotDetail(slotId: string | undefined) {
  const [slot, setSlot] = useState<OpenSlotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!slotId) {
      setSlot(null);
      setLoading(false);
      return;
    }
    const silent = opts?.silent ?? false;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await apiFetch<{ slot: OpenSlotDetail }>(`/v1/open-slots/${slotId}`);
      setSlot(data.slot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load slot detail");
      setSlot(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [slotId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { slot, loading, error, reload: load };
}
