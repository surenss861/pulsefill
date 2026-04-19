"use client";

import Link from "next/link";
import { actionButtonLabel, kindLabel } from "@/lib/action-queue-ui";
import { formatSlotRange } from "@/lib/format-slot-range";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ActionQueueItem } from "@/types/action-queue";

function severityBorder(severity: ActionQueueItem["severity"]): string {
  if (severity === "high") return "rgba(251, 191, 36, 0.35)";
  if (severity === "medium") return "rgba(56, 189, 248, 0.28)";
  return "rgba(255,255,255,0.1)";
}

export function ActionQueueItemCard({ item }: { item: ActionQueueItem }) {
  const meta = [item.service_name, item.provider_name].filter(Boolean).join(" · ") || "Slot";
  const where = item.location_name ? ` · ${item.location_name}` : "";
  const when = formatSlotRange(item.starts_at, item.ends_at);
  const rel = formatRelativeTime(item.created_at);

  const [primary, secondary] = item.actions;

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${severityBorder(item.severity)}`,
        background: "rgba(255,255,255,0.03)",
        padding: 16,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            padding: "4px 8px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            color: "var(--muted)",
          }}
        >
          {kindLabel(item.kind)}
        </span>
        {item.customer_label ? (
          <span style={{ fontSize: 13, color: "var(--text)" }}>Customer: {item.customer_label}</span>
        ) : null}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{item.headline}</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{item.description}</div>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        {meta}
        {where}
        <br />
        {when}
        {rel ? ` · ${rel}` : null}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {primary ? (
          <Link
            href={`/open-slots/${item.open_slot_id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 14px",
              borderRadius: 10,
              background: "var(--primary, #38bdf8)",
              color: "#0f172a",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            {actionButtonLabel(primary)}
          </Link>
        ) : null}
        {secondary ? (
          <Link
            href={`/open-slots/${item.open_slot_id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              color: "var(--text)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            {actionButtonLabel(secondary)}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
