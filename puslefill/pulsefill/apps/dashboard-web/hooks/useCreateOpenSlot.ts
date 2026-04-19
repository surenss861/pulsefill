"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";

export type CreateOpenSlotPayload = {
  location_id?: string | null;
  provider_id?: string | null;
  service_id?: string | null;
  provider_name_snapshot?: string | null;
  starts_at: string;
  ends_at: string;
  estimated_value_cents?: number | null;
  notes?: string | null;
};

export type CreatedOpenSlot = {
  id: string;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  estimated_value_cents?: number | null;
  provider_name_snapshot?: string | null;
};

export function useCreateOpenSlot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: CreateOpenSlotPayload) => {
    setLoading(true);
    setError(null);
    try {
      const slot = await apiFetch<CreatedOpenSlot>("/v1/open-slots", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!slot?.id) {
        throw new Error("Invalid response from server");
      }
      return slot;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create open slot";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error, setError };
}
