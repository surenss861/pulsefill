"use client";

import type { CSSProperties } from "react";

function chipStyle(status: string): CSSProperties {
  const normalized = status.toLowerCase();
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid",
  };

  if (normalized === "booked") {
    return {
      ...base,
      borderColor: "rgba(52, 211, 153, 0.35)",
      background: "rgba(16, 185, 129, 0.12)",
      color: "#6ee7b7",
    };
  }
  if (normalized === "claimed") {
    return {
      ...base,
      borderColor: "rgba(251, 191, 36, 0.35)",
      background: "rgba(245, 158, 11, 0.12)",
      color: "#fcd34d",
    };
  }
  if (normalized === "offered") {
    return {
      ...base,
      borderColor: "rgba(56, 189, 248, 0.35)",
      background: "rgba(14, 165, 233, 0.12)",
      color: "#7dd3fc",
    };
  }
  if (normalized === "cancelled" || normalized === "failed") {
    return {
      ...base,
      borderColor: "rgba(248, 113, 113, 0.35)",
      background: "rgba(239, 68, 68, 0.12)",
      color: "#fecaca",
    };
  }
  if (normalized === "expired") {
    return {
      ...base,
      borderColor: "rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.05)",
      color: "var(--muted)",
    };
  }
  if (normalized === "delivered") {
    return {
      ...base,
      borderColor: "rgba(52, 211, 153, 0.35)",
      background: "rgba(16, 185, 129, 0.12)",
      color: "#6ee7b7",
    };
  }
  if (normalized.includes("queued") || normalized === "sent" || normalized === "skipped_no_queue") {
    return {
      ...base,
      borderColor: "rgba(56, 189, 248, 0.35)",
      background: "rgba(14, 165, 233, 0.1)",
      color: "#7dd3fc",
    };
  }
  return {
    ...base,
    borderColor: "rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.75)",
  };
}

export function StateChip({ status }: { status: string }) {
  return <span style={chipStyle(status)}>{status}</span>;
}
