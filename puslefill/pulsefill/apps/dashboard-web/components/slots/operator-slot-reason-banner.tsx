"use client";

import type { OperatorSlotQueueContext, OperatorSlotQueueSeverity } from "@/types/open-slot-detail";

function severityStyles(severity: OperatorSlotQueueSeverity | null | undefined) {
  if (severity === "high") {
    return {
      border: "1px solid rgba(201, 59, 47, 0.35)",
      background: "rgba(201, 59, 47, 0.1)",
      labelColor: "rgba(252, 165, 165, 0.96)",
      rail: "#c93b2f",
    };
  }
  if (severity === "medium") {
    return {
      border: "1px solid rgba(255, 255, 255, 0.12)",
      background: "rgba(255, 122, 24, 0.06)",
      labelColor: "rgba(255, 186, 120, 0.95)",
      rail: "rgba(255, 122, 24, 0.85)",
    };
  }
  return {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(165deg, rgba(18,16,14,0.9), rgba(8,7,6,0.94))",
    labelColor: "rgba(245, 247, 250, 0.48)",
    rail: "rgba(255,255,255,0.2)",
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
        padding: "14px 16px 14px 18px",
        borderLeft: `4px solid ${s.rail}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, fontWeight: 650, letterSpacing: "0.14em", color: s.labelColor, textTransform: "uppercase" }}>
        Operator guidance
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
