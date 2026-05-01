"use client";

import type { ReactNode } from "react";

/** Inline empty section for queue tabs — warm hairline, no dashed admin chrome. */
export function ActionQueueEmptyState({ title, body }: { title: string; body?: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 14px",
        background: "rgba(0,0,0,0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <p className="pf-section-title" style={{ fontSize: 14, margin: 0 }}>
        {title}
      </p>
      {body ? (
        <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 13 }}>
          {body}
        </p>
      ) : null}
    </div>
  );
}
