"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ClaimRow } from "@/types/claim";

type OpenSlotsResponse = {
  openSlots: Array<{
    id: string;
    status: string;
    starts_at: string;
    ends_at?: string;
    estimated_value_cents?: number | null;
    provider_name_snapshot?: string | null;
    winning_claim?: ClaimRow["winning_claim"];
  }>;
};

export function useClaims() {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await apiFetch<OpenSlotsResponse>("/v1/open-slots");
      const rows: ClaimRow[] = (data.openSlots ?? [])
        .filter((s) => s.status === "claimed" || s.status === "booked")
        .map((slot) => ({
          open_slot_id: slot.id,
          slot_status: slot.status,
          provider_name_snapshot: slot.provider_name_snapshot,
          starts_at: slot.starts_at,
          ends_at: slot.ends_at,
          estimated_value_cents: slot.estimated_value_cents,
          winning_claim: slot.winning_claim ?? null,
        }));
      setClaims(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { claims, loading, error, reload: load };
}
