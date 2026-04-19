"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type OpenSlotListRow = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  provider_name_snapshot?: string | null;
  winning_claim?: { id: string; status: string } | null;
};

type OpenSlotsResponse = { openSlots: OpenSlotListRow[] };

export function useOpenSlots() {
  const [slots, setSlots] = useState<OpenSlotListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<OpenSlotsResponse>("/v1/open-slots");
      setSlots(data.openSlots ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load open slots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { slots, loading, error, reload: load };
}
