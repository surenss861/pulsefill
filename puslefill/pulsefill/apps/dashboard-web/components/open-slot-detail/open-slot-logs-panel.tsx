"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  defaultOpen?: boolean;
  summaryLabel?: string;
};

/** Deep diagnostics — collapsed by default so execution surface stays focused. */
export function OpenSlotLogsPanel({
  children,
  defaultOpen = false,
  summaryLabel = "Diagnostics details",
}: Props) {
  return (
    <details
      open={defaultOpen}
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(8, 9, 12, 0.85)",
        padding: "4px 4px 0",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          padding: "14px 16px",
          fontSize: 13,
          fontWeight: 650,
          color: "rgba(245,247,250,0.78)",
          userSelect: "none",
        }}
      >
        {summaryLabel}
      </summary>
      <div style={{ padding: "0 12px 16px" }}>{children}</div>
      <style>{`
        details > summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </details>
  );
}
