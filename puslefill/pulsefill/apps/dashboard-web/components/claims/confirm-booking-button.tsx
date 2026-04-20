"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import { pressableHandlers, pressablePrimary } from "@/lib/pressable";

type Props = {
  openSlotId: string;
  claimId: string;
  onConfirmed?: () => void;
};

export function ConfirmBookingButton({ openSlotId, claimId, onConfirmed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleConfirm() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ ok: boolean; message?: string }>(`/v1/open-slots/${openSlotId}/confirm`, {
        method: "POST",
        body: JSON.stringify({ claim_id: claimId }),
      });
      showToast({
        title: res.message?.trim() || "Booking confirmed.",
        tone: "success",
      });
      onConfirmed?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to confirm booking";
      setError(message);
      showToast({ title: message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={loading}
        style={{
          ...pressablePrimary,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
        {...pressableHandlers(loading)}
      >
        {loading ? "Confirming…" : "Confirm booking"}
      </button>
      {error ? <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>{error}</p> : null}
    </div>
  );
}
