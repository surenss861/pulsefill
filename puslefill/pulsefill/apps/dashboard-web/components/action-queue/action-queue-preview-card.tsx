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
}: {
  items: ActionQueueItem[];
  loading: boolean;
  error: string | null;
  /** When set, shows real queue counts above the list. */
  summary?: ActionQueueSummary | null;
  /** Tighter surface when this module is secondary to Next Best Action (Command Center). */
  hierarchy?: "default" | "secondary";
}) {
  const top = items.slice(0, 5);
  const totalIssues =
    (summary?.needs_action_count ?? 0) +
    (summary?.awaiting_confirmation_count ?? 0) +
    (summary?.delivery_failed_count ?? 0);
  const summaryLine =
    summary != null && totalIssues > 0
      ? `${summary.needs_action_count} need action · ${summary.awaiting_confirmation_count} awaiting confirmation · ${summary.delivery_failed_count} delivery issues`
      : null;

  const secondary = hierarchy === "secondary";

  return (
    <div
      style={{
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
      }}
    >
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
              "No urgent items right now."
            )}
          </p>
        </div>
        <Link
          href="/action-queue?section=needs_action"
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            color: "var(--text)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Open queue
        </Link>
      </div>

      {error ? <p style={{ color: "#f87171", marginTop: 12 }}>{error}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading…</p> : null}

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
