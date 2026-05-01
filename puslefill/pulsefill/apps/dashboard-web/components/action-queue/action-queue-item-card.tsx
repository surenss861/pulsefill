"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { actionButtonLabel, kindLabel } from "@/lib/action-queue-ui";
import { reasonCopyForQueueKind } from "@/lib/action-queue-copy";
import { deriveQueueInlinePrimaryAction } from "@/lib/operator-primary-action";
import { formatSlotRange } from "@/lib/format-slot-range";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { queueDetailPath, type QueueDetailSection } from "@/lib/open-slot-routes";
import { MotionAction, MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { RecordRowCard } from "@/components/ui/record-row-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { StatusPillVariant } from "@/components/ui/status-pill";
import type { ActionQueueItem, ActionQueueKind } from "@/types/action-queue";

export type ActionQueueRowSection = QueueDetailSection;

function sectionChrome(section: ActionQueueRowSection | undefined): { border: string; background: string } {
  if (section === "needs_action") {
    return { border: "rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.07)" };
  }
  if (section === "review") {
    return { border: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" };
  }
  if (section === "resolved") {
    return { border: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" };
  }
  return { border: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" };
}

function queueKindPillVariant(kind: ActionQueueKind): StatusPillVariant {
  if (kind === "delivery_failed" || kind === "expired_unfilled") return "danger";
  if (kind === "confirmed_booking") return "resolved";
  if (kind === "no_matches") return "default";
  return "primary";
}

const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 14px",
  borderRadius: 10,
  background: "var(--pf-btn-primary-bg)",
  color: "var(--pf-btn-primary-text)",
  fontWeight: 600,
  fontSize: 13,
  border: "none",
  cursor: "pointer",
  boxShadow: "var(--pf-btn-primary-shadow)",
};

const primaryMutedBtn: CSSProperties = {
  ...primaryBtn,
  background: "rgba(255,255,255,0.08)",
  color: "var(--pf-text-primary)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "none",
};

const secondaryLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  color: "var(--pf-text-primary)",
  fontSize: 13,
  textDecoration: "none",
  fontWeight: 600,
};

type Props = {
  item: ActionQueueItem;
  section?: ActionQueueRowSection;
  busy?: boolean;
  onPrimaryAction?: (item: ActionQueueItem) => void;
};

export function ActionQueueItemCard({ item, section, busy, onPrimaryAction }: Props) {
  const meta = [item.service_name, item.provider_name].filter(Boolean).join(" · ") || "Slot";
  const where = item.location_name ? ` · ${item.location_name}` : "";
  const when = formatSlotRange(item.starts_at, item.ends_at);
  const rel = formatRelativeTime(item.created_at);
  const reason = reasonCopyForQueueKind(item.kind);

  const [primary, secondary] = item.actions;
  const inline = deriveQueueInlinePrimaryAction(item);
  const canInline = Boolean(inline && onPrimaryAction);
  const detailHref = queueDetailPath(item.open_slot_id, section);
  const chrome = sectionChrome(section);

  const primaryMuted = section === "resolved";

  const linkBlock = (
    <Link href={detailHref} prefetch={false} title="Open detail" style={{ color: "inherit", textDecoration: "none" }}>
      <div style={{ fontWeight: 650, fontSize: 16, lineHeight: 1.35 }}>{item.headline}</div>
      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.45, color: "rgba(245, 247, 250, 0.72)" }}>
        {meta}
        {where}
      </div>
      <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "rgba(245, 247, 250, 0.9)" }}>{reason}</div>
      {item.customer_label ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--pf-text-secondary)" }}>Customer: {item.customer_label}</div>
      ) : null}
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--pf-text-secondary)", opacity: 0.95 }}>
        {when}
        {rel ? ` · ${rel}` : null}
      </div>
    </Link>
  );

  const topMeta = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <StatusPill variant={queueKindPillVariant(item.kind)} caps>
        {kindLabel(item.kind)}
      </StatusPill>
    </div>
  );

  const footer = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
      {canInline && inline ? (
        <MotionTapSurface disabled={busy}>
          <button
            type="button"
            onClick={() => onPrimaryAction?.(item)}
            disabled={busy}
            style={{
              ...(primaryMuted ? primaryMutedBtn : primaryBtn),
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Working…" : inline.label}
          </button>
        </MotionTapSurface>
      ) : primary ? (
        <MotionAction>
          <Link href={detailHref} prefetch={false} style={{ ...(primaryMuted ? primaryMutedBtn : primaryBtn), textDecoration: "none" }}>
            {actionButtonLabel(primary)}
          </Link>
        </MotionAction>
      ) : null}
      {secondary ? (
        <MotionAction>
          <Link href={detailHref} prefetch={false} style={{ ...secondaryLink, opacity: primaryMuted ? 0.85 : 1 }}>
            {actionButtonLabel(secondary)}
          </Link>
        </MotionAction>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        borderRadius: "var(--pf-radius-md)",
        border: `1px solid ${chrome.border}`,
        background: chrome.background,
        padding: "12px 14px",
      }}
    >
      <RecordRowCard
        disableHover
        topMeta={topMeta}
        title={linkBlock}
        footer={footer}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
        }}
      />
    </div>
  );
}
