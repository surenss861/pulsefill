"use client";

import type { ReactNode } from "react";

export type DeskConfirmPrimaryVariant = "warm" | "danger";

type Props = {
  open: boolean;
  /** Stable id for `aria-labelledby`. */
  titleId: string;
  title: string;
  children?: ReactNode;
  busy?: boolean;
  primaryLabel: string;
  primaryBusyLabel?: string;
  primaryVariant?: DeskConfirmPrimaryVariant;
  onPrimary: () => void;
  /** Quiet action (Cancel, Keep opening, etc.). */
  secondaryLabel?: string;
  onClose: () => void;
};

/**
 * Shared Operations desk confirmation overlay (`pf-desk-confirm-modal__*`).
 * Backdrop click closes when not busy (same as secondary).
 */
export function OperatorDeskConfirmDialog({
  open,
  titleId,
  title,
  children,
  busy = false,
  primaryLabel,
  primaryBusyLabel = "Working…",
  primaryVariant = "warm",
  onPrimary,
  secondaryLabel = "Cancel",
  onClose,
}: Props) {
  if (!open) return null;

  const primaryClass =
    primaryVariant === "danger"
      ? "pf-desk-confirm-modal__btn-primary pf-desk-confirm-modal__btn-primary--danger"
      : "pf-desk-confirm-modal__btn-primary pf-desk-confirm-modal__btn-primary--warm";

  function backdropMouseDown() {
    if (!busy) onClose();
  }

  return (
    <div className="pf-desk-confirm-modal__backdrop" role="presentation" onMouseDown={backdropMouseDown}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pf-desk-confirm-modal__panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="pf-desk-confirm-modal__title">
          {title}
        </h2>
        {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
        <div className="pf-desk-confirm-modal__actions">
          <button type="button" className="pf-desk-confirm-modal__btn-quiet" disabled={busy} onClick={onClose}>
            {secondaryLabel}
          </button>
          <button type="button" className={primaryClass} disabled={busy} onClick={onPrimary}>
            {busy ? primaryBusyLabel : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
