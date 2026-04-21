"use client";

import type { ReactNode } from "react";

const DEFAULT_TITLE = "Action Queue";
const DEFAULT_SUBTITLE =
  "The live worklist for appointment recovery. Review urgent slots, follow up where needed, and clear the queue.";

type Props = {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
};

/**
 * Inbox-style anchor for the operator worklist (summary chips / refresh live beside this).
 */
export function ActionQueuePageHeader({ children, title = DEFAULT_TITLE, subtitle = DEFAULT_SUBTITLE }: Props) {
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
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <p style={{ color: "var(--muted)", maxWidth: 560, marginBottom: 0 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
