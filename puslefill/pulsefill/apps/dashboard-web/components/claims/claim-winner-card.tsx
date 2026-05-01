"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { displayCustomer } from "@/lib/customer-ref";
import { claimsDetailPath } from "@/lib/open-slot-routes";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import { OperatorActionPanel } from "@/components/operator/operator-action-panel";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import { StateChip } from "@/components/ui/state-chip";
import type { ClaimRow } from "@/types/claim";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { operatorClaimStatusKind, operatorClaimStatusLabel } from "@/lib/operator-claim-status-labels";
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
  const rawClaimStatus = claim.winning_claim?.status;
  const claimStatusLabel = operatorClaimStatusLabel(rawClaimStatus);
  const claimStatusKind = operatorClaimStatusKind(rawClaimStatus);
  const claimStatusCell: ReactNode =
    claim.winning_claim != null ? (
      <OperatorStatusChip kind={claimStatusKind} label={claimStatusLabel} />
    ) : (
      "—"
    );

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

      {isBooked ? (
        <p className="pf-muted-copy" style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.5 }}>
          This recovery is confirmed. No further staff action required on this opening.
        </p>
      ) : null}

      <div
        className="pf-claim-metrics-row"
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gap: 10,
        }}
      >
        <Metric label="Opening value" value={dollars(claim.estimated_value_cents)} quiet={!needsConfirmation} />
        <Metric
          label="Claimed at"
          value={claim.winning_claim?.claimed_at ? formatDate(claim.winning_claim.claimed_at) : "—"}
          quiet={!needsConfirmation}
        />
        <Metric label="Claim status" value={claimStatusCell} hot={needsConfirmation} />
      </div>

      {needsConfirmation && claimId ? (
        <div style={{ marginTop: 16 }}>
          <OperatorActionPanel
            eyebrow="Booking"
            title="Confirm this booking"
            description="The customer claimed this opening. Confirm once the appointment is booked in the clinic calendar."
            priority="critical"
            primaryAction={<ConfirmBookingButton openSlotId={claim.open_slot_id} claimId={claimId} onConfirmed={onConfirmed} />}
            secondaryAction={
              <MotionAction>
                <Link href={claimsDetailPath(claim.open_slot_id)} prefetch={false} style={actionLinkStyle("secondary")}>
                  Open opening detail
                </Link>
              </MotionAction>
            }
          />
        </div>
      ) : needsConfirmation ? (
        <div style={{ marginTop: 16 }}>
          <OperatorActionPanel
            eyebrow="Booking"
            title="Confirm this booking"
            description="We couldn’t load a winning claim id for this row yet. Open the opening to refresh."
            priority="attention"
            secondaryAction={
              <MotionAction>
                <Link href={claimsDetailPath(claim.open_slot_id)} prefetch={false} style={actionLinkStyle("secondary")}>
                  Open opening detail
                </Link>
              </MotionAction>
            }
          />
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {isBooked ? null : (
            <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14 }}>
              No action available for this row.
            </p>
          )}
          <MotionAction>
            <Link href={claimsDetailPath(claim.open_slot_id)} prefetch={false} style={actionLinkStyle("secondary")}>
              Open opening detail
            </Link>
          </MotionAction>
        </div>
      )}
    </article>
  );
}

function Metric({ label, value, quiet, hot }: { label: string; value: ReactNode; quiet?: boolean; hot?: boolean }) {
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
      <div
        style={{
          marginTop: 6,
          fontSize: 14,
          fontWeight: hot ? 700 : 600,
          color: "var(--pf-text-primary)",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {value}
      </div>
    </div>
  );
}
