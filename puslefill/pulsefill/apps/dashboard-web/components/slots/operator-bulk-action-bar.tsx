"use client";

import type { CSSProperties } from "react";

type Props = {
  count: number;
  onRetryOffers: () => void;
  onExpire: () => void;
  onClear: () => void;
  busy: boolean;
};

export function OperatorBulkActionBar({ count, onRetryOffers, onExpire, onClear, busy }: Props) {
  if (count <= 0) return null;

  const btn: CSSProperties = {
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
    border: "1px solid rgba(255,255,255,0.12)",
    opacity: busy ? 0.65 : 1,
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        padding: "12px 20px calc(12px + env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, transparent 0%, rgba(10,12,16,0.92) 24%, rgba(10,12,16,0.98) 100%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 650, color: "var(--text)" }}>
        {count} selected
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" disabled={busy} onClick={onRetryOffers} style={{ ...btn, background: "var(--primary)", color: "#0a0c10", border: "none" }}>
          {busy ? "Working…" : "Retry offers"}
        </button>
        <button type="button" disabled={busy} onClick={onExpire} style={{ ...btn, background: "rgba(248,113,113,0.15)", color: "#fecaca", borderColor: "rgba(248,113,113,0.35)" }}>
          {busy ? "Working…" : "Expire openings"}
        </button>
        <button type="button" disabled={busy} onClick={onClear} style={{ ...btn, background: "transparent", color: "var(--muted)" }}>
          Clear
        </button>
      </div>
    </div>
  );
}
