"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { emitOperatorRefreshEvent } from "@/lib/operator-refresh-events";
import { useToast } from "@/components/ui/toast-provider";
import { MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { OperatorDeskConfirmDialog } from "@/components/operator/operator-desk-confirm-dialog";
import { pressableHandlers, pressablePrimary } from "@/lib/pressable";

type Props = {
  openSlotId: string;
  claimId: string;
  onConfirmed?: () => void;
  /** Fired when the API rejects with `operator_action_not_allowed` (stale UI / state changed). */
  onConflict?: () => void | Promise<void>;
};

export function ConfirmBookingButton({ openSlotId, claimId, onConfirmed, onConflict }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      emitOperatorRefreshEvent("slot:updated", { slotId: openSlotId, action: "confirm_booking" });
      setDialogOpen(false);
      onConfirmed?.();
    } catch (err) {
      const code = err instanceof Error ? (err as { code?: string }).code : undefined;
      if (code === "operator_action_not_allowed") {
        showToast({
          title: "This opening changed — refreshing.",
          tone: "info",
        });
        setDialogOpen(false);
        await onConflict?.();
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to confirm booking";
      setError(message);
      showToast({ title: message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <MotionTapSurface disabled={loading || dialogOpen}>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDialogOpen(true);
          }}
          disabled={loading || dialogOpen}
          style={{
            ...pressablePrimary,
            opacity: loading || dialogOpen ? 0.6 : 1,
            cursor: loading || dialogOpen ? "not-allowed" : "pointer",
          }}
          {...pressableHandlers(loading || dialogOpen)}
        >
          Confirm booking
        </button>
      </MotionTapSurface>

      <OperatorDeskConfirmDialog
        open={dialogOpen}
        titleId={`pf-desk-confirm-booking-${claimId}`}
        title="Confirm this booking?"
        busy={loading}
        primaryLabel="Confirm booking"
        primaryBusyLabel="Confirming…"
        primaryVariant="warm"
        onPrimary={() => void handleConfirm()}
        secondaryLabel="Cancel"
        onClose={() => {
          if (!loading) {
            setDialogOpen(false);
            setError(null);
          }
        }}
      >
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
          This marks the opening as booked and closes the recovery loop.
        </p>
        {error ? (
          <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.45, color: "rgba(248,113,113,0.92)" }}>
            {error}
          </p>
        ) : null}
      </OperatorDeskConfirmDialog>
    </div>
  );
}
