"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { OperatorActivityItem } from "@/types/operator-activity-feed";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  operatorActivityActorLabel,
  operatorActivityKindEmphasis,
  operatorActivityKindLabel,
} from "@/lib/operator-activity-presentation";
import type { OperatorActivityEmphasis } from "@/lib/operator-activity-presentation";
import { activityDetailPath } from "@/lib/open-slot-routes";
import { RecordRowCard } from "@/components/ui/record-row-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { StatusPillVariant } from "@/components/ui/status-pill";

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

function pillVariant(e: OperatorActivityEmphasis): StatusPillVariant {
  if (e === "primary") return "primary";
  if (e === "danger") return "danger";
  if (e === "resolved") return "resolved";
  return "default";
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
    allowSlotDetailNav && item.open_slot_id ? activityDetailPath(item.open_slot_id) : null;

  const metaParts: string[] = [];
  if (item.provider_name) metaParts.push(item.provider_name);
  if (item.location_name) metaParts.push(item.location_name);
  if (item.starts_at) metaParts.push(formatSlotWindow(item.starts_at));
  const contextLine = metaParts.length > 0 ? metaParts.join(" · ") : null;

  const emphasis = operatorActivityKindEmphasis(item.kind);
  const relative = formatRelativeTime(item.occurred_at);
  const actor = operatorActivityActorLabel(item.kind);

  const why =
    item.priority_summary?.trim() ||
    item.recovery_recommendation_title?.trim() ||
    item.detail?.trim() ||
    null;

  const topMeta = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, rowGap: 6 }}>
      <StatusPill variant={pillVariant(emphasis)} caps>
        {operatorActivityKindLabel(item.kind)}
      </StatusPill>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(245, 247, 250, 0.34)",
        }}
      >
        {relative}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(245, 247, 250, 0.28)",
        }}
      >
        {actor}
      </span>
    </div>
  );

  const leading =
    showSelection && item.bulk_selectable && item.open_slot_id ? (
      <input
        type="checkbox"
        checked={Boolean(selected)}
        onChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row for bulk actions"
      />
    ) : showSelection ? (
      <span style={{ width: 18 }} />
    ) : undefined;

  const linkStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 650,
    color: "#ffb070",
    textDecoration: "none",
    whiteSpace: "nowrap",
    padding: "8px 12px",
    borderRadius: "var(--pf-radius-sm)",
    border: "1px solid var(--pf-border-subtle)",
    background: "rgba(255,255,255,0.03)",
  };

  return (
    <RecordRowCard
      leading={leading}
      topMeta={topMeta}
      title={item.title}
      detail={contextLine}
      body={why}
      actions={slotHref ? (
        <Link href={slotHref} prefetch={false} style={linkStyle} title="Open detail">
          Open detail
        </Link>
      ) : undefined}
    />
  );
}
