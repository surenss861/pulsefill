"use client";

import Link from "next/link";
import type { OperatorActivityItem } from "@/types/operator-activity-feed";
import {
  operatorActivityKindAccentColor,
  operatorActivityKindLabel,
} from "@/lib/operator-activity-presentation";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function OperatorActivityCard(props: {
  item: OperatorActivityItem;
  showSelection?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { item, showSelection, selected, onToggleSelect } = props;
  const accent = operatorActivityKindAccentColor(item.kind);
  const slotHref = item.open_slot_id ? `/open-slots/${item.open_slot_id}` : null;

  const body = (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 14,
        background: "rgba(255,255,255,0.02)",
        display: "grid",
        gap: 8,
        alignItems: "start",
        gridTemplateColumns: showSelection ? "auto 1fr" : "1fr",
      }}
    >
      {showSelection && item.bulk_selectable && item.open_slot_id ? (
        <input
          type="checkbox"
          checked={Boolean(selected)}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row for bulk actions"
        />
      ) : showSelection ? (
        <span style={{ width: 18 }} />
      ) : null}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 650, color: accent, letterSpacing: 0.4 }}>
          {operatorActivityKindLabel(item.kind).toUpperCase()}
        </div>
        <div style={{ fontSize: 15, fontWeight: 650 }}>{item.title}</div>
        {item.detail ? (
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.35 }}>{item.detail}</div>
        ) : null}
        <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {item.provider_name ? <span>{item.provider_name}</span> : null}
          {item.slot_status ? <span>· {item.slot_status}</span> : null}
          {item.starts_at ? (
            <span>
              ·{" "}
              {new Date(item.starts_at).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{formatWhen(item.occurred_at)}</div>
        {slotHref ? (
          <Link href={slotHref} style={{ fontSize: 13, color: "#7dd3fc", marginTop: 4 }}>
            Open slot detail →
          </Link>
        ) : null}
      </div>
    </div>
  );

  return body;
}
