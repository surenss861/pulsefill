"use client";

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
    return "Matching waitlist customers get notified when possible. Slots that are no longer open are skipped.";
  }
  return "Only openings that are still open or offered are expired; the rest are skipped. You cannot undo that from this list.";
}

function confirmLabel(action: BulkSlotActionKind, busy: boolean): string {
  if (busy) return "Working…";
  if (action === "retry_offers") return "Send offers";
  return "Expire openings";
}

export function OperatorBulkActionConfirmModal({ open, action, count, onConfirm, onCancel, busy }: Props) {
  if (!open || !action) return null;

  const primaryClass =
    action === "expire"
      ? "pf-desk-confirm-modal__btn-primary pf-desk-confirm-modal__btn-primary--danger"
      : "pf-desk-confirm-modal__btn-primary pf-desk-confirm-modal__btn-primary--warm";

  return (
    <div className="pf-desk-confirm-modal__backdrop" role="dialog" aria-modal="true">
      <div className="pf-desk-confirm-modal__panel">
        <h2 className="pf-desk-confirm-modal__title">{titleForAction(action)}</h2>
        <p className="pf-muted-copy" style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55 }}>
          This applies to <strong style={{ color: "var(--pf-text-primary)" }}>{count}</strong> selected opening
          {count === 1 ? "" : "s"}.
        </p>
        <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.5 }}>{bodyForAction(action)}</p>
        <div className="pf-desk-confirm-modal__actions">
          <button type="button" className="pf-desk-confirm-modal__btn-quiet" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={primaryClass} onClick={onConfirm} disabled={busy}>
            {confirmLabel(action, busy)}
          </button>
        </div>
      </div>
    </div>
  );
}
