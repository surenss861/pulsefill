"use client";

import type { OpenSlotDetail } from "@/types/open-slot-detail";

type Props = {
  slot: OpenSlotDetail;
};

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function OperatorSlotOffersSummary({ slot }: Props) {
  const offers = slot.slot_offers ?? [];
  if (offers.length === 0 && !slot.last_offer_batch_at) return null;

  const st = (s: string) => s.toLowerCase();
  const active = offers.filter((o) => ["sent", "delivered", "viewed"].includes(st(o.status))).length;
  const failed = offers.filter((o) => st(o.status) === "failed").length;
  const expired = offers.filter((o) => st(o.status) === "expired").length;

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.2)",
        padding: "14px 16px",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, fontWeight: 650, letterSpacing: "0.06em", color: "var(--muted)" }}>
        OFFERS (THIS OPENING)
      </p>
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Total rows</div>
          <div style={{ fontWeight: 650, color: "var(--text)", marginTop: 4 }}>{offers.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Active pipeline</div>
          <div style={{ fontWeight: 650, color: "var(--text)", marginTop: 4 }}>{active}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Delivery issues</div>
          <div style={{ fontWeight: 650, color: "var(--text)", marginTop: 4 }}>{failed}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Expired rows</div>
          <div style={{ fontWeight: 650, color: "var(--text)", marginTop: 4 }}>{expired}</div>
        </div>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--muted)" }}>
        Last offer batch: <span style={{ color: "var(--text)" }}>{formatWhen(slot.last_offer_batch_at)}</span>
      </p>
    </div>
  );
}
