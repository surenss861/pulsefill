"use client";

import Link from "next/link";
import { actionButtonLabel, kindLabel } from "@/lib/action-queue-ui";
import { reasonCopyForQueueKind } from "@/lib/action-queue-copy";
import { deriveQueueInlinePrimaryAction } from "@/lib/operator-primary-action";
import { formatSlotRange } from "@/lib/format-slot-range";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { openSlotDetailPath } from "@/lib/open-slot-routes";
import type { ActionQueueItem } from "@/types/action-queue";

export type ActionQueueRowSection = "needs_action" | "review" | "resolved";

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

type Props = {
  item: ActionQueueItem;
  /** Drives calmer vs urgent card chrome; omit for neutral styling. */
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
  const detailHref = openSlotDetailPath(item.open_slot_id);
  const chrome = sectionChrome(section);

  const primaryMuted = section === "resolved";

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${chrome.border}`,
        background: chrome.background,
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Link
          href={detailHref}
          prefetch={false}
          title="Open detail"
          style={{
            flex: 1,
            minWidth: 0,
            display: "block",
            textDecoration: "none",
            color: "inherit",
            borderRadius: 10,
            outlineOffset: 2,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.35 }}>{item.headline}</div>
              <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.45, color: "var(--text)", opacity: 0.72 }}>
                {meta}
                {where}
              </div>
              <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "var(--text)", opacity: 0.9 }}>
                {reason}
              </div>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "var(--text)",
                opacity: section === "resolved" ? 0.75 : 1,
              }}
            >
              {kindLabel(item.kind)}
            </span>
          </div>
          {item.customer_label ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>Customer: {item.customer_label}</div>
          ) : null}
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", opacity: 0.9 }}>
            {when}
            {rel ? ` · ${rel}` : null}
          </div>
        </Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
        {canInline && inline ? (
          <button
            type="button"
            onClick={() => onPrimaryAction?.(item)}
            disabled={busy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 14px",
              borderRadius: 10,
              background: primaryMuted ? "rgba(255,255,255,0.08)" : "var(--primary, #38bdf8)",
              color: primaryMuted ? "var(--text)" : "#0f172a",
              fontWeight: 600,
              fontSize: 13,
              border: primaryMuted ? "1px solid rgba(255,255,255,0.14)" : "none",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Working…" : inline.label}
          </button>
        ) : primary ? (
          <Link
            href={detailHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 14px",
              borderRadius: 10,
              background: primaryMuted ? "rgba(255,255,255,0.08)" : "var(--primary, #38bdf8)",
              color: primaryMuted ? "var(--text)" : "#0f172a",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              border: primaryMuted ? "1px solid rgba(255,255,255,0.14)" : "none",
            }}
          >
            {actionButtonLabel(primary)}
          </Link>
        ) : null}
        {secondary ? (
          <Link
            href={detailHref}
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
              opacity: primaryMuted ? 0.85 : 1,
            }}
          >
            {actionButtonLabel(secondary)}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
