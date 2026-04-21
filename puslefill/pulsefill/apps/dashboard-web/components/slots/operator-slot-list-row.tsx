"use client";

import Link from "next/link";
import { StateChip } from "@/components/ui/state-chip";
import { formatSlotRange } from "@/lib/format-slot-range";
import { deriveOperatorPrimaryActionFromSlot, type DerivedOperatorPrimaryAction } from "@/lib/operator-primary-action";
import { openSlotDetailPath } from "@/lib/open-slot-routes";
import { getOperatorSlotAttentionLabel } from "@/lib/operator-slots-ui";
import type { OperatorSlotsListItem } from "@/types/operator-slots-list";

function formatEstValue(cents?: number | null): string | null {
  if (cents == null || cents <= 0) return null;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

type Props = {
  slot: OperatorSlotsListItem;
  busy: boolean;
  onPrimaryAction: (slot: OperatorSlotsListItem, action: DerivedOperatorPrimaryAction) => void;
  selection?: { selected: boolean; onToggle: () => void };
};

/** Inventory-style row: identity, status, light actions — not queue reasoning. */
export function OperatorSlotListRow({
  slot,
  busy,
  onPrimaryAction,
  selection,
}: Props) {
  const primaryAction = deriveOperatorPrimaryActionFromSlot(slot);
  const attentionLabel = getOperatorSlotAttentionLabel(slot);
  const range =
    slot.starts_at && slot.ends_at ? formatSlotRange(slot.starts_at, slot.ends_at) : "—";
  const detailHref = openSlotDetailPath(slot.id);
  const valueLabel = formatEstValue(slot.estimated_value_cents);
  const scanLine = [
    slot.provider_name_snapshot?.trim(),
    slot.location_name?.trim(),
    range !== "—" ? range : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const title = scanLine || "Open slot";

  const secondaryLinkStyle = {
    borderRadius: 999,
    padding: "9px 12px",
    border: "1px solid rgba(255,255,255,0.12)",
    textDecoration: "none" as const,
    display: "inline-block" as const,
    color: "var(--text)",
    fontSize: 13,
    fontWeight: 500,
  };

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: selection?.selected ? "rgba(77,226,197,0.06)" : "rgba(255,255,255,0.02)",
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        {selection ? (
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
        ) : null}
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
            borderRadius: 12,
            outlineOffset: 2,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.35 }}>{title}</div>
              {attentionLabel ? (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{attentionLabel}</div>
              ) : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <StateChip status={String(slot.status)} />
              {valueLabel ? (
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{valueLabel}</div>
              ) : null}
            </div>
          </div>
        </Link>
      </div>

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
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.65 : 1,
            }}
          >
            {busy ? "Working…" : primaryAction.label}
          </button>
        ) : null}

        <Link href={detailHref} prefetch={false} style={secondaryLinkStyle}>
          Open detail
        </Link>
      </div>
    </div>
  );
}
