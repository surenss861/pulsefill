"use client";

import Link from "next/link";
import { ActionQueueItemCard } from "@/components/action-queue/action-queue-item-card";
import type { ActionQueueItem, ActionQueueSummary } from "@/types/action-queue";

export function ActionQueuePreviewCard({
  items,
  loading,
  error,
  summary,
  hierarchy = "default",
  deckEmbedded = false,
}: {
  items: ActionQueueItem[];
  loading: boolean;
  error: string | null;
  /** When set, shows real queue counts above the list. */
  summary?: ActionQueueSummary | null;
  /** Tighter surface when this module is secondary to Next Best Action on overview. */
  hierarchy?: "default" | "secondary";
  /** Flat body for Operations desk cards (parent supplies title + “Open queue”). */
  deckEmbedded?: boolean;
}) {
  const top = items.slice(0, 5);
  const followUps = summary?.customer_follow_up_due_count ?? 0;
  const totalIssues =
    (summary?.needs_action_count ?? 0) +
    (summary?.awaiting_confirmation_count ?? 0) +
    (summary?.delivery_failed_count ?? 0) +
    followUps;
  const summaryLine =
    summary != null && totalIssues > 0
      ? `${summary.needs_action_count} need action · ${summary.awaiting_confirmation_count} awaiting confirmation · ${summary.delivery_failed_count} delivery issues${
          followUps > 0 ? ` · ${followUps} customer follow-up${followUps === 1 ? "" : "s"}` : ""
        }`
      : null;

  const secondary = hierarchy === "secondary";
  const quietEmpty = !loading && !error && top.length === 0 && !summaryLine;
  const embedShell = deckEmbedded && secondary;

  if (secondary && quietEmpty && deckEmbedded) {
    return (
      <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
        Nothing needs action right now. New claims, failed offers, and stuck openings will show up here.
      </p>
    );
  }

  if (secondary && quietEmpty && !deckEmbedded) {
    return (
      <div className="pf-needs-attention-strip">
        <div className="pf-needs-attention-strip__copy">
          <h2 className="pf-needs-attention-strip__title">Nothing needs action</h2>
          <p className="pf-needs-attention-strip__detail pf-muted-copy">
            New claims, failed offers, and stuck openings will appear here.
          </p>
        </div>
        <Link href="/action-queue?section=needs_action" className="pf-queue-preview-cta">
          Open queue
        </Link>
      </div>
    );
  }

  const shellStyle = embedShell
    ? { marginTop: 0 as const }
    : {
        marginTop: secondary ? 12 : 24,
        borderRadius: secondary ? 16 : 20,
        border: secondary ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.1)",
        background: secondary
          ? "linear-gradient(165deg, rgba(255,255,255,0.028), rgba(0,0,0,0.2))"
          : "linear-gradient(165deg, rgba(255,255,255,0.045), rgba(255,122,24,0.014) 48%, rgba(10,9,7,0.92))",
        boxShadow: secondary
          ? "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 28px rgba(0,0,0,0.2)"
          : "0 20px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
        padding: secondary ? 18 : 22,
      };

  return (
    <div style={shellStyle}>
      {!embedShell ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Needs attention</h2>
            <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14, maxWidth: 520 }}>
              {summaryLine ? (
                <>
                  <span style={{ color: "rgba(245, 247, 250, 0.72)" }}>{summaryLine}</span>
                  <span style={{ display: "block", marginTop: 6 }}>
                    Top of the queue — highest severity first.
                  </span>
                </>
              ) : (
                <>
                  <span style={{ color: "rgba(245, 247, 250, 0.82)", fontWeight: 600 }}>Nothing needs action</span>
                  <span style={{ display: "block", marginTop: 6 }}>
                    New claims, failed offers, and stuck openings will appear here.
                  </span>
                </>
              )}
            </p>
          </div>
          <Link href="/action-queue?section=needs_action" className="pf-queue-preview-cta">
            Open queue
          </Link>
        </div>
      ) : summaryLine ? (
        <p className="pf-muted-copy" style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.5 }}>
          <span style={{ color: "rgba(245, 247, 250, 0.78)", fontWeight: 600 }}>{summaryLine}</span>
          <span style={{ display: "block", marginTop: 8 }}>Top of the queue — highest severity first.</span>
        </p>
      ) : null}

      {error ? <p style={{ color: "#f87171", marginTop: 12 }}>{error}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", marginTop: embedShell ? 0 : 16 }}>Loading…</p> : null}

      {!loading && !error && top.length === 0 && summaryLine ? (
        <p style={{ color: "var(--muted)", marginTop: 16, marginBottom: 0 }}>Nothing queued in this section.</p>
      ) : null}

      {!loading && top.length > 0 ? (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {top.map((item) => (
            <ActionQueueItemCard key={item.id} item={item} section="needs_action" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
