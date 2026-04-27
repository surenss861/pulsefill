"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { RecordRowCard } from "@/components/ui/record-row-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { StatusPillVariant } from "@/components/ui/status-pill";
import { formatSlotRange } from "@/lib/format-slot-range";
import { deriveOperatorPrimaryActionFromSlot, type DerivedOperatorPrimaryAction } from "@/lib/operator-primary-action";
import { openSlotDetailPath } from "@/lib/open-slot-routes";
import { getOperatorSlotAttentionLabel } from "@/lib/operator-slots-ui";
import type { OperatorSlotsListItem, OperatorSlotStatus } from "@/types/operator-slots-list";

function formatEstValue(cents?: number | null): string | null {
  if (cents == null || cents <= 0) return null;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatStatusLabel(raw: string): string {
  if (!raw) return "—";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function slotStatusPillVariant(status: OperatorSlotStatus): StatusPillVariant {
  const s = String(status).toLowerCase();
  if (s === "booked") return "resolved";
  if (s === "expired" || s === "cancelled") return "danger";
  if (s === "claimed" || s === "offered") return "primary";
  return "default";
}

type Props = {
  slot: OperatorSlotsListItem;
  busy: boolean;
  onPrimaryAction: (slot: OperatorSlotsListItem, action: DerivedOperatorPrimaryAction) => void;
  selection?: { selected: boolean; onToggle: () => void };
  detailHref?: string;
};

/** Inventory-style row: identity, status, light actions — not queue reasoning. */
export function OperatorSlotListRow({
  slot,
  busy,
  onPrimaryAction,
  selection,
  detailHref: detailHrefProp,
}: Props) {
  const primaryAction = deriveOperatorPrimaryActionFromSlot(slot);
  const attentionLabel = getOperatorSlotAttentionLabel(slot);
  const range = slot.starts_at && slot.ends_at ? formatSlotRange(slot.starts_at, slot.ends_at) : "—";
  const detailHref = detailHrefProp ?? openSlotDetailPath(slot.id);
  const valueLabel = formatEstValue(slot.estimated_value_cents);
  const scanLine = [slot.provider_name_snapshot?.trim(), slot.location_name?.trim(), range !== "—" ? range : null]
    .filter(Boolean)
    .join(" · ");
  const rowTitle = scanLine || "Open slot";

  const selectedShell: CSSProperties | undefined = selection?.selected
    ? {
        border: "1px solid rgba(255, 255, 255, 0.14)",
        background: "rgba(255, 122, 24, 0.06)",
      }
    : undefined;

  const leading = selection ? (
    <input
      type="checkbox"
      checked={selection.selected}
      onChange={(e) => {
        e.stopPropagation();
        selection.onToggle();
      }}
      aria-label={`Select slot ${slot.provider_name_snapshot ?? slot.id}`}
      style={{ marginTop: 4, width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
    />
  ) : undefined;

  const titleLink = (
    <Link href={detailHref} prefetch={false} title="Open detail" style={{ color: "inherit", textDecoration: "none" }}>
      <span style={{ fontSize: 16, fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.35 }}>{rowTitle}</span>
    </Link>
  );

  const actions = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
      <StatusPill variant={slotStatusPillVariant(slot.status)}>{formatStatusLabel(String(slot.status))}</StatusPill>
      {valueLabel ? <div style={{ fontSize: 12, color: "var(--pf-text-secondary)", fontWeight: 500 }}>{valueLabel}</div> : null}
    </div>
  );

  const footer = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
      {primaryAction ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrimaryAction(slot, primaryAction);
          }}
          disabled={busy}
          style={{
            borderRadius: 999,
            padding: "9px 14px",
            border: "1px solid var(--pf-border-subtle)",
            background: "rgba(255,255,255,0.08)",
            color: "var(--pf-text-primary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.65 : 1,
          }}
        >
          {busy ? "Working…" : primaryAction.label}
        </button>
      ) : null}
      <Link
        href={detailHref}
        prefetch={false}
        style={{
          borderRadius: 999,
          padding: "9px 12px",
          border: "1px solid var(--pf-border-subtle)",
          textDecoration: "none",
          display: "inline-block",
          color: "var(--pf-text-primary)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Open detail
      </Link>
    </div>
  );

  return (
    <RecordRowCard
      leading={leading}
      title={titleLink}
      detail={attentionLabel ? <span style={{ fontSize: 12, color: "var(--pf-text-secondary)" }}>{attentionLabel}</span> : undefined}
      actions={actions}
      footer={footer}
      style={selectedShell}
    />
  );
}
