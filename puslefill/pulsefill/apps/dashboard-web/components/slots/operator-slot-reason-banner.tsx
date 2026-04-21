"use client";

import type { OperatorSlotQueueContext, OperatorSlotQueueSeverity } from "@/types/open-slot-detail";

function severityStyles(severity: OperatorSlotQueueSeverity | null | undefined) {
  if (severity === "high") {
    return {
      border: "1px solid rgba(248,113,113,0.35)",
      background: "rgba(248,113,113,0.08)",
      labelColor: "rgba(252,165,165,0.95)",
    };
  }
  if (severity === "medium") {
    return {
      border: "1px solid rgba(251,191,36,0.35)",
      background: "rgba(251,191,36,0.07)",
      labelColor: "rgba(253,224,71,0.95)",
    };
  }
  return {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    labelColor: "var(--muted)",
  };
}

type Props = {
  queueContext: OperatorSlotQueueContext;
};

export function OperatorSlotReasonBanner({ queueContext }: Props) {
  if (!queueContext.reason_title) return null;

  const s = severityStyles(queueContext.severity);

  return (
    <div
      style={{
        borderRadius: 16,
        border: s.border,
        background: s.background,
        padding: "14px 16px",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, fontWeight: 650, letterSpacing: "0.06em", color: s.labelColor }}>
        QUEUE CONTEXT
      </p>
      <h2 style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 650, color: "var(--text)" }}>{queueContext.reason_title}</h2>
      {queueContext.reason_detail ? (
        <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--muted)", maxWidth: 720 }}>
          {queueContext.reason_detail}
        </p>
      ) : null}
    </div>
  );
}
