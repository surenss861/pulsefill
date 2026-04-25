"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

function borderForStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === "booked") return "var(--pf-success-border)";
  if (s === "claimed") return "var(--pf-warning-border)";
  if (s === "offered") return "var(--pf-accent-primary-border)";
  if (s === "expired" || s === "cancelled") return "var(--pf-border-subtle)";
  return "var(--pf-border-default)";
}

type Props = {
  status: string;
  children: ReactNode;
  style?: CSSProperties;
};

/** Accent border + hover lift for slot-related cards and list rows. */
export function SlotRowShell({ status, children, style }: Props) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${borderForStatus(status)}`,
        background: hover ? "rgba(255,255,255,0.06)" : "var(--surface)",
        padding: 20,
        transition: "background 0.2s ease, border-color 0.2s ease",
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </div>
  );
}
