"use client";

import type { CSSProperties, ReactNode } from "react";
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
  /** Operations desk: case-file layout (visit title, time, status, calmer actions). */
  variant?: "default" | "desk";
};

/** Inventory-style row: identity, status, light actions — not queue reasoning. */
export function OperatorSlotListRow({
  slot,
  busy,
  onPrimaryAction,
  selection,
  detailHref: detailHrefProp,
  variant = "default",
}: Props) {
  const primaryAction = deriveOperatorPrimaryActionFromSlot(slot);
  const attentionLabel = getOperatorSlotAttentionLabel(slot);
  const range = slot.starts_at && slot.ends_at ? formatSlotRange(slot.starts_at, slot.ends_at) : "—";
  const detailHref = detailHrefProp ?? openSlotDetailPath(slot.id);
  const valueLabel = formatEstValue(slot.estimated_value_cents);
  const scanLine = [slot.provider_name_snapshot?.trim(), slot.location_name?.trim(), range !== "—" ? range : null]
    .filter(Boolean)
    .join(" · ");
  const rowTitle = scanLine || "Appointment opening";

  const rawNote = slot.notes?.trim();
  const visitTitle =
    rawNote && rawNote.length > 0
      ? rawNote.split("\n")[0].trim().slice(0, 100)
      : slot.provider_name_snapshot?.trim() || "Appointment opening";
  const st = (slot.status || "").toLowerCase();

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

  const primaryBtn = primaryAction ? (
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
  ) : null;

  const detailLinkLabel = variant === "desk" ? "View opening" : "Open detail";

  const footer = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
      {primaryBtn}
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
        {detailLinkLabel}
      </Link>
    </div>
  );

  if (variant === "desk") {
    const contextParts = [slot.location_name?.trim(), slot.provider_name_snapshot?.trim()].filter(Boolean);
    const contextLine = contextParts.join(" · ");
    const bodyBits: ReactNode[] = [];
    if (attentionLabel) bodyBits.push(<div key="a">{attentionLabel}</div>);
    if (st === "open" || st === "offered") {
      bodyBits.push(
        <div key="nc" style={{ color: "rgba(245, 247, 250, 0.58)" }}>
          No claim yet
        </div>,
      );
    }
    const deskTitleLink = (
      <Link href={detailHref} prefetch={false} title="View opening" style={{ color: "inherit", textDecoration: "none" }}>
        <span style={{ fontSize: 16, fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.35 }}>{visitTitle}</span>
      </Link>
    );

    const deskDetail = (
      <>
        <span>{range !== "—" ? range : "Time not set"}</span>
        {contextLine ? (
          <>
            <br />
            <span style={{ fontSize: 12, color: "rgba(245, 247, 250, 0.5)" }}>{contextLine}</span>
          </>
        ) : null}
      </>
    );

    const deskBody =
      bodyBits.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{bodyBits}</div>
      ) : undefined;

    const deskShell: CSSProperties = {
      ...selectedShell,
      borderLeft: "3px solid rgba(255, 122, 24, 0.28)",
    };

    return (
      <RecordRowCard
        leading={leading}
        title={deskTitleLink}
        detail={deskDetail}
        body={deskBody}
        actions={actions}
        footer={footer}
        style={deskShell}
      />
    );
  }

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
