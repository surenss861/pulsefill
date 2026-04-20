"use client";

import type { CSSProperties } from "react";

export function OperatorActivityBulkActionBar(props: {
  count: number;
  onRetry: () => void;
  onOpenInSlots: () => void;
  onClear: () => void;
  busy?: boolean;
}) {
  const { count, onRetry, onOpenInSlots, onClear, busy } = props;
  if (count === 0) return null;

  const btn: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.65 : 1,
  };

  return (
    <div
      style={{
        position: "sticky",
        bottom: 12,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(56,189,248,0.25)",
        background: "rgba(14,165,233,0.08)",
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 650 }}>{count} selected</span>
      <button type="button" style={btn} disabled={busy} onClick={onRetry}>
        Retry offers
      </button>
      <button type="button" style={btn} disabled={busy} onClick={onOpenInSlots}>
        Open in slots
      </button>
      <button type="button" style={{ ...btn, marginLeft: "auto" }} disabled={busy} onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
