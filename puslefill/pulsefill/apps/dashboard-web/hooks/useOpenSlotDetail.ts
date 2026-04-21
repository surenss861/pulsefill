"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  OpenSlotDetail,
  OpenSlotDetailApiResponse,
  OperatorSlotAvailableAction,
  OperatorSlotQueueContext,
} from "@/types/open-slot-detail";

const emptyQueueContext = (): OperatorSlotQueueContext => ({
  current_category: null,
  current_section: null,
  reason_title: null,
  reason_detail: null,
  severity: null,
});

export function useOpenSlotDetail(slotId: string | undefined) {
  const [slot, setSlot] = useState<OpenSlotDetail | null>(null);
  const [queueContext, setQueueContext] = useState<OperatorSlotQueueContext>(emptyQueueContext);
  const [availableActions, setAvailableActions] = useState<OperatorSlotAvailableAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!slotId) {
      setSlot(null);
      setQueueContext(emptyQueueContext());
      setAvailableActions([]);
      setLoading(false);
      return;
    }
    const silent = opts?.silent ?? false;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await apiFetch<OpenSlotDetailApiResponse>(`/v1/open-slots/${slotId}`);
      setSlot(data.slot);
      setQueueContext(data.queue_context ?? emptyQueueContext());
      setAvailableActions(Array.isArray(data.available_actions) ? data.available_actions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load slot detail");
      setSlot(null);
      setQueueContext(emptyQueueContext());
      setAvailableActions([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [slotId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { slot, queueContext, availableActions, loading, error, reload: load };
}
