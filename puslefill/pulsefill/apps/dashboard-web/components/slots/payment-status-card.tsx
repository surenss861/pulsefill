"use client";

import { useState } from "react";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { apiFetch } from "@/lib/api";
import type { OpenSlotDetail } from "@/types/open-slot-detail";

function paymentStatusLabel(status: NonNullable<OpenSlotDetail["payment"]>["status"]): string {
  const labels: Record<NonNullable<OpenSlotDetail["payment"]>["status"], string> = {
    requires_payment: "Awaiting payment",
    authorized: "Payment held",
    capturing: "Charging…",
    captured: "Paid",
    canceled: "Payment canceled",
    refunded: "Refunded",
    failed: "Payment failed",
  };
  return labels[status] ?? status;
}

function paymentStatusChipKind(status: NonNullable<OpenSlotDetail["payment"]>["status"]): OperatorStatusKind {
  if (status === "captured") return "confirmed";
  if (status === "authorized" || status === "capturing") return "pending";
  if (status === "refunded") return "cancelled";
  if (status === "failed") return "failed";
  if (status === "canceled") return "inactive";
  return "setup";
}

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

type Props = {
  slot: OpenSlotDetail;
  onRefunded?: () => void;
};

export function PaymentStatusCard({ slot, onRefunded }: Props) {
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!slot.payment_required) return null;

  const payment = slot.payment ?? null;
  const claimId = slot.winning_claim?.id ?? payment?.claim_id ?? null;
  const canRefund = payment?.status === "captured" && Boolean(claimId);

  async function refund() {
    if (!claimId) return;
    setError(null);
    setRefunding(true);
    try {
      await apiFetch(`/v1/open-slots/${slot.id}/refund`, {
        method: "POST",
        body: JSON.stringify({ claim_id: claimId }),
      });
      onRefunded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refund failed. Try again.");
    } finally {
      setRefunding(false);
    }
  }

  return (
    <DeskSecondaryCard title="Payment">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {payment ? (
          <OperatorStatusChip kind={paymentStatusChipKind(payment.status)} label={paymentStatusLabel(payment.status)} />
        ) : (
          <OperatorStatusChip kind="setup" label="Awaiting payment" />
        )}
        {slot.price_cents ? (
          <span className="pf-muted-copy" style={{ fontSize: 13 }}>
            {formatMoney(slot.price_cents, slot.currency ?? "usd")}
          </span>
        ) : null}
      </div>
      {error ? (
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#f87171" }}>{error}</p>
      ) : null}
      {canRefund ? (
        <button
          type="button"
          disabled={refunding}
          onClick={() => void refund()}
          style={{
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: !refunding ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
            color: !refunding ? "var(--pf-text-primary)" : "rgba(245,247,250,0.45)",
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: !refunding ? "pointer" : "not-allowed",
          }}
        >
          {refunding ? "Refunding…" : "Refund customer"}
        </button>
      ) : null}
    </DeskSecondaryCard>
  );
}
