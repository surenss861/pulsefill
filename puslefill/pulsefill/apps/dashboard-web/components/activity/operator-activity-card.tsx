"use client";

import Link from "next/link";
import type { OperatorActivityItem } from "@/types/operator-activity-feed";
import { operatorActivityKindLabel } from "@/lib/operator-activity-presentation";
import { openSlotDetailPath } from "@/lib/open-slot-routes";

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

function formatSlotWindow(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
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
  const actions = item.available_actions;
  const allowSlotDetailNav =
    Boolean(item.open_slot_id) && (!actions?.length || actions.includes("open_detail"));
  const slotHref =
    allowSlotDetailNav && item.open_slot_id ? openSlotDetailPath(item.open_slot_id) : null;

  const metaParts: string[] = [];
  if (item.provider_name) metaParts.push(item.provider_name);
  if (item.location_name) metaParts.push(item.location_name);
  if (item.starts_at) metaParts.push(formatSlotWindow(item.starts_at));
  const contextLine = metaParts.length > 0 ? metaParts.join(" · ") : null;

  const occurredLine = formatWhen(item.occurred_at);

  const main = (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted)",
          opacity: 0.9,
        }}
      >
        {operatorActivityKindLabel(item.kind)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 650, marginTop: 6, lineHeight: 1.35 }}>{item.title}</div>
      {item.detail ? (
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45, marginTop: 6 }}>{item.detail}</div>
      ) : null}
      {contextLine ? (
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.4 }}>{contextLine}</div>
      ) : null}
      <div style={{ fontSize: 12, color: "var(--muted)", opacity: 0.9, marginTop: 6 }}>{occurredLine}</div>
    </div>
  );

  const openDetailStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#7dd3fc",
    textDecoration: "none" as const,
    whiteSpace: "nowrap" as const,
    padding: "6px 4px",
    flexShrink: 0,
  };

  const cols = showSelection
    ? slotHref
      ? "auto minmax(0,1fr) auto"
      : "auto minmax(0,1fr)"
    : slotHref
      ? "minmax(0,1fr) auto"
      : "minmax(0,1fr)";

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.02)",
        display: "grid",
        gap: 10,
        alignItems: "start",
        gridTemplateColumns: cols,
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
      {main}
      {slotHref ? (
        <Link href={slotHref} prefetch={false} style={openDetailStyle} title="Open detail">
          Open detail
        </Link>
      ) : null}
    </div>
  );
}
