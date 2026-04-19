"use client";

import type { CSSProperties } from "react";

function chipStyle(status: string): CSSProperties {
  const normalized = status.toLowerCase();
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 650,
    border: "1px solid",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  };

  if (normalized === "failed") {
    return {
      ...base,
      borderColor: "rgba(248,113,113,0.45)",
      background: "rgba(239,68,68,0.15)",
      color: "#fecaca",
    };
  }
  if (normalized === "expired") {
    return {
      ...base,
      borderColor: "rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.06)",
      color: "var(--muted)",
    };
  }
  if (normalized === "claimed") {
    return {
      ...base,
      borderColor: "rgba(52,211,153,0.4)",
      background: "rgba(16,185,129,0.14)",
      color: "#6ee7b7",
    };
  }
  if (normalized === "delivered") {
    return {
      ...base,
      borderColor: "rgba(56,189,248,0.35)",
      background: "rgba(14,165,233,0.12)",
      color: "#7dd3fc",
    };
  }
  if (normalized === "viewed") {
    return {
      ...base,
      borderColor: "rgba(167,139,250,0.35)",
      background: "rgba(139,92,246,0.12)",
      color: "#c4b5fd",
    };
  }
  if (normalized === "sent") {
    return {
      ...base,
      borderColor: "rgba(251,191,36,0.35)",
      background: "rgba(245,158,11,0.1)",
      color: "#fcd34d",
    };
  }
  return {
    ...base,
    borderColor: "rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.75)",
  };
}

const LABELS: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  viewed: "Viewed",
  claimed: "Claimed",
  expired: "Expired",
  failed: "Failed",
};

export function OfferStatusChip({ status }: { status: string }) {
  const key = status.toLowerCase();
  const label = LABELS[key] ?? status;
  return <span style={chipStyle(status)}>{label}</span>;
}
