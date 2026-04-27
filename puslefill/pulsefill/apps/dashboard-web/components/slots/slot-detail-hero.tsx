"use client";

import { StateChip } from "@/components/ui/state-chip";
import type { OpenSlotDetail } from "@/types/open-slot-detail";

function dollars(cents?: number | null) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format((cents ?? 0) / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(10, 15, 26, 0.65)",
        padding: 14,
      }}
    >
      <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,247,250,0.42)" }}>
        {label}
      </p>
      <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600, color: "var(--pf-text-primary)" }}>{value}</p>
    </div>
  );
}

function summarizeOfferDelivery(offers: OpenSlotDetail["slot_offers"]): string {
  let delivered = 0;
  let failed = 0;
  let expired = 0;
  let claimed = 0;
  for (const o of offers) {
    const k = o.status.toLowerCase();
    if (k === "delivered") delivered++;
    else if (k === "failed") failed++;
    else if (k === "expired") expired++;
    else if (k === "claimed") claimed++;
  }
  return `${offers.length} total · ${delivered} delivered · ${failed} failed · ${expired} expired · ${claimed} claimed`;
}

type Props = {
  slot: OpenSlotDetail;
  serviceLabel: string;
  locationLabel: string;
  namesLoading: boolean;
};

/** Title, window, and status — use at top of execution surface. */
export function SlotDetailIdentityHeader({ slot, serviceLabel, locationLabel, namesLoading }: Props) {
  const sv = namesLoading ? "…" : serviceLabel;
  const lv = namesLoading ? "…" : locationLabel;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 240px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "rgba(245, 247, 250, 0.38)",
            textTransform: "uppercase",
          }}
        >
          Opening
        </p>
        <h1
          style={{
            margin: "10px 0 0",
            fontSize: "clamp(1.35rem, 2.8vw, 1.85rem)",
            fontWeight: 650,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "var(--pf-text-primary)",
          }}
        >
          {slot.provider_name_snapshot ?? "Open appointment"}
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.5, color: "rgba(245, 247, 250, 0.55)" }}>
          <span style={{ color: "rgba(245,247,250,0.35)" }}>Service · </span>
          {sv}
          <span style={{ margin: "0 8px", color: "rgba(245,247,250,0.2)" }}>|</span>
          <span style={{ color: "rgba(245,247,250,0.35)" }}>Location · </span>
          {lv}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(245, 247, 250, 0.62)" }}>
          {formatDate(slot.starts_at)} → {formatDate(slot.ends_at)}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        <StateChip status={slot.status} />
      </div>
    </div>
  );
}

/** Dense facts for the slot record (slot context section). */
export function SlotDetailFactsGrid({ slot, serviceLabel, locationLabel, namesLoading }: Props) {
  const sv = namesLoading ? "…" : serviceLabel;
  const lv = namesLoading ? "…" : locationLabel;
  const valueLabel =
    slot.estimated_value_cents !== undefined && slot.estimated_value_cents !== null
      ? dollars(slot.estimated_value_cents)
      : "—";
  const lastSent = slot.last_offer_batch_at ? formatDate(slot.last_offer_batch_at) : "—";
  const lastTouch = slot.last_touched_at ? formatDate(slot.last_touched_at) : "—";
  const touchedBy =
    slot.last_touched_by?.full_name?.trim() ||
    slot.last_touched_by?.email?.split("@")[0]?.trim() ||
    "—";

  return (
    <>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
        }}
      >
        <Metric label="Service" value={sv} />
        <Metric label="Location" value={lv} />
        <Metric label="Est. value" value={valueLabel} />
        <Metric label="Offers" value={String(slot.slot_offers.length)} />
        <Metric label="Claims" value={String(slot.slot_claims.length)} />
        <Metric label="Last offers sent" value={lastSent} />
        <Metric label="Last updated" value={lastTouch} />
        <Metric label="Last touched by" value={touchedBy} />
      </div>

      {slot.slot_offers.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 122, 24, 0.05)",
            padding: "12px 14px",
            fontSize: 13,
            color: "rgba(245, 247, 250, 0.72)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: "rgba(245,247,250,0.4)", fontSize: 11, fontWeight: 650, letterSpacing: "0.16em" }}>
            Offer outcomes
          </span>
          <p style={{ margin: "6px 0 0", color: "var(--pf-text-primary)" }}>{summarizeOfferDelivery(slot.slot_offers)}</p>
        </div>
      ) : null}
    </>
  );
}

/** @deprecated Prefer `SlotDetailIdentityHeader` + `SlotDetailFactsGrid` in layout; kept for compatibility. */
export function SlotDetailHero({ slot, serviceLabel, locationLabel, namesLoading }: Props) {
  return (
    <>
      <SlotDetailIdentityHeader slot={slot} serviceLabel={serviceLabel} locationLabel={locationLabel} namesLoading={namesLoading} />
      <div style={{ marginTop: 22 }}>
        <SlotDetailFactsGrid slot={slot} serviceLabel={serviceLabel} locationLabel={locationLabel} namesLoading={namesLoading} />
      </div>
    </>
  );
}
