"use client";

import type { ActionQueueSummary } from "@/types/action-queue";

export function ActionQueueSummaryBar({ summary }: { summary: ActionQueueSummary }) {
  const items = [
    { label: "Needs action", value: summary.needs_action_count, accent: "#fcd34d" },
    { label: "Review", value: summary.review_count, accent: "#7dd3fc" },
    { label: "Resolved", value: summary.resolved_count, accent: "#86efac" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {items.map((x) => (
        <div
          key={x.label}
          style={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            padding: "12px 16px",
            minWidth: 120,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>{x.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: x.accent }}>{x.value}</div>
        </div>
      ))}
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 16px",
          fontSize: 12,
          color: "var(--muted)",
          alignSelf: "center",
        }}
      >
        Awaiting confirm: {summary.awaiting_confirmation_count} · Failed delivery: {summary.delivery_failed_count} · Retry:{" "}
        {summary.retry_recommended_count}
      </div>
    </div>
  );
}
