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
      borderColor: "var(--pf-success-border)",
      background: "var(--pf-success-soft)",
      color: "var(--pf-chip-success-text)",
    };
  }
  if (normalized === "claimed") {
    return {
      ...base,
      borderColor: "var(--pf-warning-border)",
      background: "var(--pf-warning-soft)",
      color: "var(--pf-chip-warning-text)",
    };
  }
  if (normalized === "offered") {
    return {
      ...base,
      borderColor: "var(--pf-accent-primary-border)",
      background: "var(--pf-accent-primary-soft)",
      color: "var(--pf-chip-primary-text)",
    };
  }
  if (normalized === "cancelled" || normalized === "failed") {
    return {
      ...base,
      borderColor: "var(--pf-danger-border)",
      background: "var(--pf-danger-soft)",
      color: "var(--pf-chip-danger-text)",
    };
  }
  if (normalized === "expired") {
    return {
      ...base,
      borderColor: "var(--pf-border-subtle)",
      background: "rgba(255,255,255,0.05)",
      color: "var(--muted)",
    };
  }
  if (normalized === "delivered") {
    return {
      ...base,
      borderColor: "var(--pf-success-border)",
      background: "var(--pf-success-soft)",
      color: "var(--pf-chip-success-text)",
    };
  }
  if (normalized.includes("queued") || normalized === "sent" || normalized === "skipped_no_queue") {
    return {
      ...base,
      borderColor: "var(--pf-accent-primary-border)",
      background: "rgba(255, 122, 24, 0.1)",
      color: "#ffedd5",
    };
  }
  return {
    ...base,
    borderColor: "var(--pf-chip-neutral-border)",
    background: "var(--pf-chip-neutral-bg)",
    color: "rgba(255,255,255,0.75)",
  };
}

export function StateChip({ status }: { status: string }) {
  return <span style={chipStyle(status)}>{status}</span>;
}
