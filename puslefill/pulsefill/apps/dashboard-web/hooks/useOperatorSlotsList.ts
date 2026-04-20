"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getOperatorSlotCounts, matchesOperatorSlotFilter } from "@/lib/operator-slots-ui";
import type { OperatorOpenSlotsListResponse, OperatorSlotsFilter, OperatorSlotsListItem } from "@/types/operator-slots-list";

export function useOperatorSlotsList(filter: OperatorSlotsFilter) {
  const [slots, setSlots] = useState<OperatorSlotsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;

    if (silent) {
      setReloading(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await apiFetch<OperatorOpenSlotsListResponse>("/v1/open-slots/mine");
      setSlots(data.openSlots ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load slots.";
      setError(message);
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSlots = useMemo(
    () => slots.filter((slot) => matchesOperatorSlotFilter(slot, filter)),
    [slots, filter],
  );

  const counts = useMemo(() => getOperatorSlotCounts(slots), [slots]);

  return {
    slots,
    filteredSlots,
    counts,
    loading,
    reloading,
    error,
    reload: load,
  };
}
