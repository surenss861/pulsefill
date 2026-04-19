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
        background: "rgba(0,0,0,0.2)",
        padding: 14,
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{label}</p>
      <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600 }}>{value}</p>
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

export function SlotDetailHero({ slot, serviceLabel, locationLabel, namesLoading }: Props) {
  const sv = namesLoading ? "…" : serviceLabel;
  const lv = namesLoading ? "…" : locationLabel;
  const valueLabel =
    slot.estimated_value_cents !== undefined && slot.estimated_value_cents !== null
      ? dollars(slot.estimated_value_cents)
      : "—";
  const lastSent = slot.last_offer_batch_at ? formatDate(slot.last_offer_batch_at) : "—";

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--muted)",
            }}
          >
            OPENING FOR
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 650, letterSpacing: "-0.02em" }}>
            {slot.provider_name_snapshot ?? "Open appointment"}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.45 }}>
            <span style={{ color: "var(--muted)" }}>When · </span>
            {formatDate(slot.starts_at)} → {formatDate(slot.ends_at)}
          </p>
        </div>
        <div style={{ alignSelf: "flex-start" }}>
          <StateChip status={slot.status} />
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        }}
      >
        <Metric label="Service" value={sv} />
        <Metric label="Location" value={lv} />
        <Metric label="Est. value" value={valueLabel} />
        <Metric label="Offers" value={String(slot.slot_offers.length)} />
        <Metric label="Claims" value={String(slot.slot_claims.length)} />
        <Metric label="Last offers sent" value={lastSent} />
      </div>

      {slot.slot_offers.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: "1px solid rgba(77,226,197,0.2)",
            background: "rgba(77,226,197,0.06)",
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 650, letterSpacing: "0.05em" }}>
            OFFER OUTCOMES
          </span>
          <p style={{ margin: "6px 0 0", color: "var(--text)" }}>{summarizeOfferDelivery(slot.slot_offers)}</p>
        </div>
      ) : null}
    </>
  );
}
