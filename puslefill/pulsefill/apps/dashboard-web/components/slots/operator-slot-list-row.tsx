"use client";

import Link from "next/link";
import { StateChip } from "@/components/ui/state-chip";
import { formatSlotRange } from "@/lib/format-slot-range";
import { deriveOperatorPrimaryActionFromSlot, type DerivedOperatorPrimaryAction } from "@/lib/operator-primary-action";
import { getOperatorSlotAttentionLabel } from "@/lib/operator-slots-ui";
import type { OperatorSlotsListItem } from "@/types/operator-slots-list";

type Props = {
  slot: OperatorSlotsListItem;
  busy: boolean;
  onPrimaryAction: (slot: OperatorSlotsListItem, action: DerivedOperatorPrimaryAction) => void;
  selection?: { selected: boolean; onToggle: () => void };
};

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

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: selection?.selected ? "rgba(77,226,197,0.06)" : "rgba(255,255,255,0.03)",
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
        <div style={{ display: "grid", gap: 6, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {slot.provider_name_snapshot || "Unknown provider"}
          </div>

          <div style={{ fontSize: 13, opacity: 0.75 }}>{range}</div>

          {slot.notes ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>{slot.notes}</div>
          ) : null}

          {attentionLabel ? (
            <div style={{ fontSize: 12, opacity: 0.8 }}>{attentionLabel}</div>
          ) : null}
        </div>

        <StateChip status={String(slot.status)} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {primaryAction ? (
          <button
            type="button"
            onClick={() => onPrimaryAction(slot, primaryAction)}
            disabled={busy}
            style={{
              borderRadius: 999,
              padding: "9px 12px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.10)",
              color: "var(--text)",
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "Working…" : primaryAction.label}
          </button>
        ) : null}

        <Link
          href={`/open-slots/${slot.id}`}
          style={{
            borderRadius: 999,
            padding: "9px 12px",
            border: "1px solid rgba(255,255,255,0.08)",
            textDecoration: "none",
            display: "inline-block",
            color: "var(--text)",
          }}
        >
          Open
        </Link>
      </div>
    </div>
  );
}
