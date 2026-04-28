"use client";

import type { ReactNode } from "react";

const DEFAULT_OVERLINE = "Queue";
const DEFAULT_TITLE = "What needs attention";
const DEFAULT_SUBTITLE =
  "The live worklist for appointment recovery. Review urgent openings, follow up where needed, and clear the queue.";

type Props = {
  children?: ReactNode;
  overline?: string;
  title?: string;
  subtitle?: string;
};

/**
 * Inbox-style anchor for the operator worklist (summary chips / refresh live beside this).
 */
export function ActionQueuePageHeader({
  children,
  overline = DEFAULT_OVERLINE,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 8,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(245, 247, 250, 0.38)",
          }}
        >
          {overline}
        </p>
        <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.65rem, 3.5vw, 2.25rem)", fontWeight: 650, letterSpacing: "-0.03em" }}>
          {title}
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 560, marginBottom: 0, marginTop: 10, fontSize: 14, lineHeight: 1.55 }}>
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}
