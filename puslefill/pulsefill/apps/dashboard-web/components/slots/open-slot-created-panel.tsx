"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OpenSlotCreatedSummary } from "@/components/slots/open-slot-created-summary";
import { useToast } from "@/components/ui/toast-provider";
import { apiFetch } from "@/lib/api";
import { pressableHandlers, pressablePrimary, pressableSecondary } from "@/lib/pressable";
import { navigateToOpenSlotDetail } from "@/lib/operator-navigation";
import { emitOperatorRefreshEvent } from "@/lib/operator-refresh-events";
import { SendOffersPrereqCallout } from "@/components/slots/send-offers-prereq-callout";
import { slotsDetailPath } from "@/lib/open-slot-routes";

type SendOffersResponse = {
  ok?: boolean;
  result?: "offers_sent" | "offers_retried" | "no_matches";
  matched?: number;
  offer_ids?: string[];
  message?: string;
};

function formatRange(isoStart: string, isoEnd: string) {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  return `${fmt(isoStart)} → ${fmt(isoEnd)}`;
}

function formatCad(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

type Props = {
  summary: OpenSlotCreatedSummary;
  onCreateAnother?: () => void;
};

export function OpenSlotCreatedPanel({ summary, onCreateAnother }: Props) {
  const { slotId } = summary;
  const router = useRouter();
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [noStandbyMatch, setNoStandbyMatch] = useState(false);

  async function handleSendOffers() {
    try {
      setSending(true);
      setSendError(null);
      setNoStandbyMatch(false);
      const result = await apiFetch<SendOffersResponse>(`/v1/open-slots/${slotId}/send-offers`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const msg = result.message ?? "Offers sent.";
      const isNoMatch = result.result === "no_matches";
      if (isNoMatch) {
        setNoStandbyMatch(true);
      }
      showToast({
        title: msg,
        tone: isNoMatch || msg.toLowerCase().includes("no matching") ? "info" : "success",
      });
      emitOperatorRefreshEvent("slot:updated", { slotId, action: "send_offers" });
      if (!isNoMatch) {
        navigateToOpenSlotDetail(router, slotId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send offers";
      setSendError(message);
      showToast({ title: "Couldn’t send offers.", tone: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 24,
        border: "1px solid rgba(34,197,94,0.25)",
        background: "rgba(34,197,94,0.08)",
        borderRadius: 20,
        padding: 20,
        color: "var(--text)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650 }}>Opening created</h2>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
        The opening is ready. Send offers to matching standby customers now, or open detail to review before
        sending.
      </p>

      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.18)",
          fontSize: 13,
          lineHeight: 1.55,
          display: "grid",
          gap: 6,
        }}
      >
        <div>
          <span style={{ color: "var(--muted)" }}>Provider · </span>
          <span style={{ fontWeight: 600 }}>{summary.providerLabel}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Time · </span>
          <span>{formatRange(summary.startsAt, summary.endsAt)}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Service · </span>
          <span>{summary.serviceLabel ?? "Any (broader matching)"}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Location · </span>
          <span>{summary.locationLabel ?? "Not set"}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Est. value · </span>
          <span>{formatCad(summary.estimatedValueCents)}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => void handleSendOffers()}
          disabled={sending}
          style={{
            ...pressablePrimary,
            opacity: sending ? 0.65 : 1,
            cursor: sending ? "not-allowed" : "pointer",
          }}
          {...pressableHandlers(sending)}
        >
          {sending ? "Sending…" : "Send offers now"}
        </button>
        <Link
          href={slotsDetailPath(slotId, {})}
          style={{
            ...pressableSecondary,
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          Open opening
        </Link>
      </div>

      {sendError ? <p style={{ margin: "12px 0 0", fontSize: 13, color: "#f87171" }}>{sendError}</p> : null}
      {noStandbyMatch ? <SendOffersPrereqCallout /> : null}
      {noStandbyMatch ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)" }}>
          <Link
            href={slotsDetailPath(slotId, {})}
            style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
          >
            Open opening detail
          </Link>{" "}
          to retry after you have matching standby customers.
        </p>
      ) : null}

      {onCreateAnother ? (
        <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--muted)" }}>
          <button
            type="button"
            onClick={onCreateAnother}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
              textDecoration: "underline",
            }}
          >
            Create another opening
          </button>
        </p>
      ) : null}
    </div>
  );
}
