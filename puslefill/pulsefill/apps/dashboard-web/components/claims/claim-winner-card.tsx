"use client";

import Link from "next/link";
import { displayCustomer } from "@/lib/customer-ref";
import { claimsDetailPath } from "@/lib/open-slot-routes";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import { StateChip } from "@/components/ui/state-chip";
import type { ClaimRow } from "@/types/claim";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
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

  const customerName = displayCustomer(claim.winning_claim?.customer_id);
  const serviceLine = claim.provider_name_snapshot ?? "Open appointment";

  const shell =
    needsConfirmation
      ? {
          border: "1px solid rgba(255, 122, 24, 0.42)",
          background:
            "linear-gradient(165deg, rgba(32, 22, 16, 0.98), rgba(10, 8, 7, 0.99)), radial-gradient(ellipse 90% 70% at 0% 0%, rgba(255,122,24,0.12), transparent 55%)",
          boxShadow: "0 0 0 1px rgba(255,122,24,0.06), 0 20px 52px rgba(0,0,0,0.38)",
        }
      : isBooked
        ? {
            ...operatorSurfaceShell("quiet"),
            border: "1px solid var(--pf-success-border)",
            background:
              "linear-gradient(165deg, rgba(18, 24, 18, 0.55), rgba(8, 10, 8, 0.96)), var(--pf-bg-surface, rgba(12,10,9,0.95))",
          }
        : {
            ...operatorSurfaceShell("operational"),
          };

  return (
    <article
      style={{
        borderRadius: 20,
        padding: 20,
        ...shell,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <p className="pf-kicker" style={{ margin: 0 }}>
            {needsConfirmation ? "Claim waiting" : isBooked ? "Confirmed" : "Claim record"}
          </p>
          <p className="pf-section-title" style={{ margin: "8px 0 0", fontSize: "clamp(1.05rem, 2.2vw, 1.25rem)", lineHeight: 1.25 }}>
            {customerName}
          </p>
          <p className="pf-meta-row" style={{ margin: "6px 0 0", fontSize: 14 }}>
            {appointmentLine}
            <span style={{ margin: "0 6px", color: "rgba(245,247,250,0.2)" }}>·</span>
            {serviceLine}
          </p>
        </div>
        <StateChip status={claim.slot_status} />
      </div>

      {needsConfirmation ? (
        <p className="pf-muted-copy" style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.5 }}>
          A customer won this opening. Confirm below to finalize the recovered appointment.
        </p>
      ) : null}

      {isBooked ? (
        <p className="pf-muted-copy" style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.5 }}>
          This recovery is confirmed. No further staff action required on this opening.
        </p>
      ) : null}

      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        }}
      >
        <Metric label="Opening value" value={dollars(claim.estimated_value_cents)} quiet={!needsConfirmation} />
        <Metric
          label="Claimed at"
          value={claim.winning_claim?.claimed_at ? formatDate(claim.winning_claim.claimed_at) : "—"}
          quiet={!needsConfirmation}
        />
        <Metric label="Claim status" value={claim.winning_claim?.status ?? "—"} hot={needsConfirmation} />
      </div>

      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {needsConfirmation && claimId ? (
          <ConfirmBookingButton openSlotId={claim.open_slot_id} claimId={claimId} onConfirmed={onConfirmed} />
        ) : needsConfirmation ? (
          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14 }}>
            No winning claim id on this opening yet.
          </p>
        ) : isBooked ? null : (
          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14 }}>
            No action available for this row.
          </p>
        )}
        <Link href={claimsDetailPath(claim.open_slot_id)} prefetch={false} style={actionLinkStyle("secondary")}>
          Open opening detail
        </Link>
      </div>
    </article>
  );
}

function Metric({ label, value, quiet, hot }: { label: string; value: string; quiet?: boolean; hot?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: hot ? "1px solid rgba(255,122,24,0.35)" : "1px solid rgba(255,255,255,0.08)",
        background: hot
          ? "linear-gradient(180deg, rgba(255,122,24,0.1), rgba(0,0,0,0.18))"
          : quiet
            ? "rgba(0,0,0,0.14)"
            : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.2))",
        padding: 12,
        opacity: quiet ? 0.88 : 1,
      }}
    >
      <p className="pf-kicker" style={{ margin: 0, fontSize: 10 }}>
        {label}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: hot ? 700 : 600, color: "var(--pf-text-primary)" }}>{value}</p>
    </div>
  );
}
