"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { OfferStatusChip } from "@/components/ui/offer-status-chip";
import { displayCustomer } from "@/lib/customer-ref";
import type { OpenSlotDetail } from "@/types/open-slot-detail";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const panel: CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "var(--surface)",
  padding: 20,
};

type OfferRow = OpenSlotDetail["slot_offers"][number];

function statusRank(status: string): number {
  const n = status.toLowerCase();
  if (n === "failed") return 0;
  if (n === "sent") return 1;
  if (n === "delivered") return 2;
  if (n === "viewed") return 3;
  if (n === "claimed") return 4;
  if (n === "expired") return 5;
  return 9;
}

function countByStatus(offers: OfferRow[]) {
  const out = {
    total: offers.length,
    sent: 0,
    delivered: 0,
    viewed: 0,
    claimed: 0,
    expired: 0,
    failed: 0,
  };
  for (const o of offers) {
    const k = o.status.toLowerCase() as keyof typeof out;
    if (k === "sent" || k === "delivered" || k === "viewed" || k === "claimed" || k === "expired" || k === "failed") {
      out[k]++;
    }
  }
  return out;
}

function expiryHint(expiresAt?: string | null, status?: string): string | null {
  if (!expiresAt) return null;
  const st = status?.toLowerCase() ?? "";
  if (st === "expired" || st === "claimed") return null;
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  if (Number.isNaN(exp)) return null;
  if (exp < now) return "Expired";
  const mins = Math.round((exp - now) / 60000);
  if (mins <= 60) return `Expires in ~${mins} min`;
  return null;
}

function SummaryPill({ label, value, tone }: { label: string; value: number; tone?: "default" | "warn" | "bad" }) {
  const border =
    tone === "bad"
      ? "rgba(248,113,113,0.35)"
      : tone === "warn"
        ? "rgba(251,191,36,0.35)"
        : "rgba(255,255,255,0.1)";
  const bg =
    tone === "bad"
      ? "rgba(239,68,68,0.08)"
      : tone === "warn"
        ? "rgba(251,191,36,0.06)"
        : "rgba(0,0,0,0.2)";
  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${border}`,
        background: bg,
        padding: "10px 12px",
        minWidth: 0,
      }}
    >
      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", color: "var(--muted)" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export function SlotOffersInspector({ slot }: { slot: OpenSlotDetail }) {
  const counts = useMemo(() => countByStatus(slot.slot_offers), [slot.slot_offers]);

  const sortedOffers = useMemo(() => {
    return [...slot.slot_offers].sort((a, b) => {
      const ra = statusRank(a.status);
      const rb = statusRank(b.status);
      if (ra !== rb) return ra - rb;
      const ta = a.sent_at ? new Date(a.sent_at).getTime() : 0;
      const tb = b.sent_at ? new Date(b.sent_at).getTime() : 0;
      return ta - tb;
    });
  }, [slot.slot_offers]);

  return (
    <div style={panel}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Offers</h2>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>
        Who was offered this opening, delivery state, and expiry. Failed or expired rows surface first.
      </p>

      {slot.slot_offers.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            border: "1px dashed rgba(255,255,255,0.12)",
            padding: 16,
            background: "rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No offers sent yet</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Use <strong style={{ color: "var(--text)" }}>Send offers</strong> in the next step when the slot is open or
            offered. Matching standby customers will receive offers.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
            }}
          >
            <SummaryPill label="Total" value={counts.total} />
            <SummaryPill label="Delivered" value={counts.delivered} />
            <SummaryPill label="Failed" value={counts.failed} tone={counts.failed > 0 ? "bad" : "default"} />
            <SummaryPill label="Expired" value={counts.expired} tone={counts.expired > 0 ? "warn" : "default"} />
            <SummaryPill label="Claimed" value={counts.claimed} />
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--muted)" }}>
            Sent {counts.sent}, viewed {counts.viewed}. Rows are ordered with attention-worthy states first.
          </p>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {sortedOffers.map((offer) => {
              const hint = expiryHint(offer.expires_at, offer.status);
              const isFailed = offer.status.toLowerCase() === "failed";
              return (
                <div
                  key={offer.id}
                  style={{
                    borderRadius: 16,
                    border: `1px solid ${
                      isFailed ? "rgba(248,113,113,0.28)" : "rgba(255,255,255,0.08)"
                    }`,
                    background: isFailed ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.2)",
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                        Customer {displayCustomer(offer.customer_id)}
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>
                        Channel · <strong style={{ color: "var(--text)" }}>{offer.channel}</strong>
                      </p>
                    </div>
                    <OfferStatusChip status={offer.status} />
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>Sent at</p>
                      <p style={{ margin: "6px 0 0", fontSize: 13 }}>{formatDate(offer.sent_at)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>Expires at</p>
                      <p style={{ margin: "6px 0 0", fontSize: 13 }}>{formatDate(offer.expires_at)}</p>
                      {hint ? (
                        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(251,191,36,0.95)" }}>{hint}</p>
                      ) : null}
                    </div>
                  </div>
                  {isFailed ? (
                    <p style={{ margin: "12px 0 0", fontSize: 12, color: "#fecaca", lineHeight: 1.45 }}>
                      This offer did not complete successfully. Check notification logs below for the delivery attempt.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
