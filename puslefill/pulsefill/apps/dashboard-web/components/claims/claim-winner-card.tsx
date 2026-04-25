"use client";

import Link from "next/link";
import { displayCustomer } from "@/lib/customer-ref";
import { claimsDetailPath } from "@/lib/open-slot-routes";
import { SlotRowShell } from "@/components/ui/slot-row-shell";
import { StateChip } from "@/components/ui/state-chip";
import type { ClaimRow } from "@/types/claim";
import { ConfirmBookingButton } from "./confirm-booking-button";

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

export function ClaimWinnerCard({
  claim,
  onConfirmed,
}: {
  claim: ClaimRow;
  onConfirmed?: () => void;
}) {
  const claimId = claim.winning_claim?.id;
  const needsConfirmation = claim.slot_status === "claimed";
  const isBooked = claim.slot_status === "booked";
  const appointmentLine = claim.ends_at
    ? `${formatDate(claim.starts_at)} → ${formatDate(claim.ends_at)}`
    : formatDate(claim.starts_at);

  return (
    <SlotRowShell status={claim.slot_status}>
      {needsConfirmation ? (
        <div
          style={{
            marginBottom: 18,
            borderRadius: 14,
            border: "1px solid rgba(251,191,36,0.4)",
            background: "rgba(251,191,36,0.1)",
            padding: "12px 14px",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "#fcd34d" }}>
            ACTION NEEDED · CONFIRM BOOKING
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text)", lineHeight: 1.45 }}>
            A customer won this opening. Confirm below to finalize the recovered appointment.
          </p>
        </div>
      ) : null}

      {isBooked ? (
        <div
          style={{
            marginBottom: 18,
            borderRadius: 14,
            border: "1px solid rgba(52,211,153,0.35)",
            background: "rgba(16,185,129,0.1)",
            padding: "12px 14px",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "#6ee7b7" }}>
            COMPLETE
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.45 }}>
            This recovery is confirmed. No further staff action required on this slot.
          </p>
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--muted)",
            }}
          >
            RECOVERY SLOT
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {claim.provider_name_snapshot ?? "Open appointment"}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.45 }}>
            <span style={{ color: "var(--muted)" }}>When · </span>
            {appointmentLine}
          </p>
        </div>
        <div style={{ alignSelf: "flex-start" }}>
          <StateChip status={claim.slot_status} />
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.22)",
          padding: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--muted)" }}>
          WINNING CUSTOMER
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 17,
            fontWeight: 700,
            wordBreak: "break-word",
          }}
        >
          {displayCustomer(claim.winning_claim?.customer_id)}
        </p>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        }}
      >
        <Metric label="Slot value" value={dollars(claim.estimated_value_cents)} />
        <Metric
          label="Claimed at"
          value={claim.winning_claim?.claimed_at ? formatDate(claim.winning_claim.claimed_at) : "—"}
        />
        <Metric label="Claim status" value={claim.winning_claim?.status ?? "—"} emphasized />
      </div>

      <div style={{ marginTop: 16 }}>
        <Link
          href={claimsDetailPath(claim.open_slot_id)}
          prefetch={false}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#7dd3fc",
            textDecoration: "none",
          }}
        >
          Open detail
        </Link>
      </div>

      <div style={{ marginTop: 20 }}>
        {needsConfirmation && claimId ? (
          <ConfirmBookingButton openSlotId={claim.open_slot_id} claimId={claimId} onConfirmed={onConfirmed} />
        ) : needsConfirmation ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>No winning claim id on this slot yet.</p>
        ) : isBooked ? null : (
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>No action available for this row.</p>
        )}
      </div>
    </SlotRowShell>
  );
}

function Metric({ label, value, emphasized }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: emphasized ? "rgba(77,226,197,0.06)" : "rgba(0,0,0,0.2)",
        padding: 14,
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{label}</p>
      <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: emphasized ? 700 : 600 }}>{value}</p>
    </div>
  );
}
