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
  if (action === "retry_offers") return "Retry offers for selected slots";
  return "Expire selected slots";
}

function bodyForAction(action: BulkSlotActionKind): string {
  if (action === "retry_offers") {
    return "Matching standby customers will be notified where possible. Slots that are no longer open or offered will be skipped.";
  }
  return "Only slots that are still open or offered will be expired. Others will be skipped. This cannot be undone from this screen.";
}

export function OperatorBulkActionConfirmModal({ open, action, count, onConfirm, onCancel, busy }: Props) {
  if (!open || !action) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(440px, 100%)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "var(--surface)",
          padding: 22,
          boxShadow: "0 24px 48px rgba(0,0,0,0.45)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>{titleForAction(action)}</h2>
        <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>
          You are about to run this on <strong style={{ color: "var(--text)" }}>{count}</strong> selected slot
          {count === 1 ? "" : "s"}.
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{bodyForAction(action)}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              borderRadius: 12,
              padding: "10px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "var(--text)",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              borderRadius: 12,
              padding: "10px 16px",
              border: "none",
              background: action === "expire" ? "rgba(248,113,113,0.9)" : "var(--primary)",
              color: action === "expire" ? "#1a0505" : "#0a0c10",
              fontWeight: 650,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Running…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
