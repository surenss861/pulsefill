"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OpenSlotCreatedSummary } from "@/components/slots/open-slot-created-summary";
import { useToast } from "@/components/ui/toast-provider";
import { apiFetch } from "@/lib/api";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { navigateToOpenSlotDetail } from "@/lib/operator-navigation";
import { emitOperatorRefreshEvent } from "@/lib/operator-refresh-events";
import { SendOffersPrereqCallout } from "@/components/slots/send-offers-prereq-callout";
import { slotsDetailPath } from "@/lib/open-slot-routes";

type SendOffersMatchSummary = {
  total_preferences_checked?: number;
  matched?: number;
  rejected?: Record<string, number>;
};

type SendOffersResponse = {
  ok?: boolean;
  result?: "offers_sent" | "offers_retried" | "no_matches";
  matched?: number;
  offers_created?: number;
  offer_ids?: string[];
  message?: string;
  no_matches_reason?: string;
  match_summary?: SendOffersMatchSummary;
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
  const [lastMatchSummary, setLastMatchSummary] = useState<SendOffersMatchSummary | null>(null);

  async function handleSendOffers() {
    try {
      setSending(true);
      setSendError(null);
      setNoStandbyMatch(false);
      setLastMatchSummary(null);
      const result = await apiFetch<SendOffersResponse>(`/v1/open-slots/${slotId}/send-offers`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const msg = result.message ?? "Offers sent.";
      const isNoMatch = result.result === "no_matches";
      if (isNoMatch) {
        setNoStandbyMatch(true);
        setLastMatchSummary(result.match_summary ?? null);
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
    <DeskHeroCard title="Opening created" titleId="pf-open-slot-created-title" eyebrow="On the list">
      <p className="pf-desk-hero-card__meta">
        The opening is saved. Send offers to matching waitlist customers now, or open the case file to review first.
      </p>

      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.14)",
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, alignItems: "center" }}>
        <MotionAction>
          <button
            type="button"
            className="pf-desk-save-access"
            disabled={sending}
            onClick={() => void handleSendOffers()}
          >
            {sending ? "Sending…" : "Send offers"}
          </button>
        </MotionAction>
        <MotionAction>
          <Link href={slotsDetailPath(slotId, {})} prefetch={false} className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
            View opening
          </Link>
        </MotionAction>
      </div>

      {sendError ? <p style={{ margin: "12px 0 0", fontSize: 13, color: "#f87171" }}>{sendError}</p> : null}
      {noStandbyMatch ? <SendOffersPrereqCallout /> : null}
      {noStandbyMatch && lastMatchSummary && typeof lastMatchSummary.total_preferences_checked === "number" ? (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(245,247,250,0.55)", lineHeight: 1.5 }}>
          Match engine checked{" "}
          <strong style={{ color: "var(--text)" }}>{lastMatchSummary.total_preferences_checked}</strong> active standby
          preference
          {lastMatchSummary.total_preferences_checked === 1 ? "" : "s"} for this business.
        </p>
      ) : null}
      {noStandbyMatch ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)" }}>
          <Link href={slotsDetailPath(slotId, {})} prefetch={false} className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
            View opening
          </Link>{" "}
          to retry after you have matching waitlist customers.
        </p>
      ) : null}

      {onCreateAnother ? (
        <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--muted)" }}>
          <button type="button" onClick={onCreateAnother} className="pf-desk-quiet-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}>
            Create another opening
          </button>
        </p>
      ) : null}
    </DeskHeroCard>
  );
}
