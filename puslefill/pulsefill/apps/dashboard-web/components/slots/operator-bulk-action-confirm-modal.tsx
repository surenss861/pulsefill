"use client";

import { OperatorDeskConfirmDialog } from "@/components/operator/operator-desk-confirm-dialog";
import type { BulkSlotActionKind } from "@/types/bulk-actions";

type Props = {
  open: boolean;
  action: BulkSlotActionKind | null;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
};

function titleForAction(action: BulkSlotActionKind): string {
  if (action === "retry_offers") return "Send offers for selected openings?";
  return "Expire selected openings?";
}

function bodyForAction(action: BulkSlotActionKind): string {
  if (action === "retry_offers") {
    return "PulseFill will send offers for the openings you selected. Slots that are no longer open are skipped.";
  }
  return "This closes the selected openings without confirmed bookings. Only openings that are still open or offered are expired; the rest are skipped. You cannot undo that from this list.";
}

function confirmPrimaryLabel(action: BulkSlotActionKind): string {
  if (action === "retry_offers") return "Send offers";
  return "Expire openings";
}

export function OperatorBulkActionConfirmModal({ open, action, count, onConfirm, onCancel, busy }: Props) {
  if (!open || !action) return null;

  return (
    <OperatorDeskConfirmDialog
      open
      titleId={`pf-bulk-confirm-${action}`}
      title={titleForAction(action)}
      busy={busy}
      primaryLabel={confirmPrimaryLabel(action)}
      primaryBusyLabel="Working…"
      primaryVariant={action === "expire" ? "danger" : "warm"}
      onPrimary={onConfirm}
      onClose={onCancel}
    >
      <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
        This applies to <strong style={{ color: "var(--pf-text-primary)" }}>{count}</strong> selected opening
        {count === 1 ? "" : "s"}.
      </p>
      <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.5 }}>
        {bodyForAction(action)}
      </p>
    </OperatorDeskConfirmDialog>
  );
}
