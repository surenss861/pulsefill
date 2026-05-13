"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { OperatorActivityItem } from "@/types/operator-activity-feed";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  operatorActivityDeskContextLine,
  operatorActivityDeskExplanation,
  operatorActivityDeskHeadline,
  operatorActivityKindAccentColor,
} from "@/lib/operator-activity-presentation";
import { activityDetailPath } from "@/lib/open-slot-routes";
import { RecordRowCard } from "@/components/ui/record-row-card";

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

  const headline = operatorActivityDeskHeadline(item.kind);
  const contextLine = operatorActivityDeskContextLine(item);
  const explanation = operatorActivityDeskExplanation(item);
  const relative = formatRelativeTime(item.occurred_at);
  const accent = operatorActivityKindAccentColor(item.kind);

  const leading =
    showSelection && item.bulk_selectable && item.open_slot_id ? (
      <input
        type="checkbox"
        checked={Boolean(selected)}
        onChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row for bulk actions"
        style={{ marginTop: 4, width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
      />
    ) : showSelection ? (
      <span style={{ width: 18 }} />
    ) : undefined;

  const titleNode = <span style={{ fontSize: 16, fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.35 }}>{headline}</span>;

  const detailNode =
    contextLine != null && contextLine.length > 0 ? (
      <span style={{ fontSize: 13, color: "rgba(245, 247, 250, 0.52)", lineHeight: 1.45 }}>{contextLine}</span>
    ) : undefined;

  const bodyNode = (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(245, 247, 250, 0.62)", lineHeight: 1.55 }}>{explanation}</p>
      <p style={{ margin: 0, fontSize: 12, color: "rgba(245, 247, 250, 0.38)" }}>{relative}</p>
    </div>
  );

  const linkStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--pf-text-primary)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    padding: "8px 12px",
    borderRadius: "var(--pf-radius-sm)",
    border: "1px solid var(--pf-border-subtle)",
    background: "rgba(255,255,255,0.03)",
  };

  const trailing = slotHref ? (
    <Link href={slotHref} prefetch={false} style={linkStyle} title="View opening">
      View opening →
    </Link>
  ) : undefined;

  const selectedShell: CSSProperties | undefined =
    selected === true
      ? {
          border: "1px solid rgba(255, 255, 255, 0.14)",
          background: "rgba(255, 122, 24, 0.06)",
        }
      : undefined;

  const shell: CSSProperties = {
    ...selectedShell,
    borderLeft: `3px solid ${accent}`,
  };

  return (
    <RecordRowCard
      leading={leading}
      title={titleNode}
      detail={detailNode}
      body={bodyNode}
      actions={trailing}
      style={shell}
    />
  );
}
