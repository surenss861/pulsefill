"use client";

import { ConfirmBookingButton } from "@/components/claims/confirm-booking-button";
import { RetryOffersButton } from "@/components/slots/retry-offers-button";

function nextCopy(status: string): { title: string; body: string } {
  switch (status) {
    case "open":
      return {
        title: "Send offers",
        body: "This opening hasn’t been sent to standby customers yet. Notify matches now.",
      };
    case "offered":
      return {
        title: "Offers are out",
        body: "Standby customers were notified. Resend if you changed something or want another pass.",
      };
    case "claimed":
      return {
        title: "Confirm the booking",
        body: "A customer claimed this slot. Confirm to finalize the recovered appointment.",
      };
    case "booked":
      return {
        title: "Booking confirmed",
        body: "This recovered appointment is locked in. No further offers are needed.",
      };
    case "expired":
      return {
        title: "Slot expired",
        body: "This opening is no longer available for new offers.",
      };
    case "cancelled":
      return {
        title: "Slot cancelled",
        body: "Staff cancelled this opening.",
      };
    default:
      return {
        title: "This slot",
        body: "Review details and timeline below.",
      };
  }
}

type Props = {
  status: string;
  openSlotId: string;
  claimId?: string | null;
  onActionDone?: () => void;
};

export function SlotNextActionStrip({ status, openSlotId, claimId, onActionDone }: Props) {
  const { title, body } = nextCopy(status);

  const showSendOffers = status === "open" || status === "offered";
  const showConfirm = status === "claimed" && Boolean(claimId);

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(77,226,197,0.22)",
        background: "linear-gradient(135deg, rgba(77,226,197,0.08) 0%, rgba(255,255,255,0.03) 100%)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--primary)" }}>
          NEXT STEP
        </p>
        <h2 style={{ margin: "6px 0 0", fontSize: 17, fontWeight: 650 }}>{title}</h2>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.5, maxWidth: 640 }}>
          {body}
        </p>
      </div>

      {showSendOffers || showConfirm ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
          {showSendOffers ? (
            <RetryOffersButton
              openSlotId={openSlotId}
              onDone={onActionDone}
              emphasis={status === "open" ? "primary" : "secondary"}
              label={status === "open" ? "Send offers" : "Send / retry offers"}
            />
          ) : null}
          {showConfirm && claimId ? (
            <ConfirmBookingButton openSlotId={openSlotId} claimId={claimId} onConfirmed={onActionDone} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
