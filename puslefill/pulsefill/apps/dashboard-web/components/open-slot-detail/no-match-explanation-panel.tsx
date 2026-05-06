"use client";

import Link from "next/link";
import type { NoMatchExplanationPayload } from "@/hooks/useNoMatchExplanation";
import { OperatorActionPanel } from "@/components/operator/operator-action-panel";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

type Props = {
  visible: boolean;
  data: NoMatchExplanationPayload | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

/** Which send-offers no-match audit this panel reflects (`source_observed_at` = `audit_events.created_at`). */
function formatLatestNoMatchAttemptLine(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "Based on the latest recorded no-match attempt.";
  }
  const when = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `Based on the latest no-match attempt · ${when}`;
}

function relativeNoMatchHint(iso: string): string | null {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  if (Number.isNaN(d.getTime()) || ms < 0) return null;
  if (ms < 90_000) return "Last checked just now.";
  if (ms < 3600_000) return `About ${Math.max(1, Math.round(ms / 60_000))} min ago.`;
  if (ms < 86_400_000) return "Within the last 24 hours.";
  return null;
}

function NoMatchAttemptTimestamp({ iso }: { iso: string }) {
  const hint = relativeNoMatchHint(iso);
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <p className="pf-muted-copy" style={{ margin: 0, fontSize: 11, lineHeight: 1.45 }}>
        {formatLatestNoMatchAttemptLine(iso)}
      </p>
      {hint ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 10, color: "rgba(245,247,250,0.42)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function NoMatchExplanationPanel({ visible, data, loading, error, onRetry }: Props) {
  if (!visible) return null;

  const statusKind = loading ? "pending" : data?.has_explanation ? "attention" : "pending";
  const statusLabel = loading ? "Loading…" : data?.has_explanation ? "Diagnostics on file" : "No audit yet";

  return (
    <OperatorActionPanel
      eyebrow="Send offers"
      title="Why no one matched"
      priority="attention"
      description={
        <div style={{ display: "grid", gap: 10 }}>
          {loading ? <span className="pf-muted-copy">Loading explanation…</span> : null}
          {error ? (
            <span style={{ color: "#f87171", fontSize: 13 }}>
              {error}{" "}
              <button
                type="button"
                onClick={() => onRetry()}
                style={{
                  marginLeft: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Retry
              </button>
            </span>
          ) : null}
          {!loading && !error && data ? (
            <>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: "var(--pf-text-primary)" }}>{data.headline}</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "rgba(245,247,250,0.72)" }}>{data.explanation}</p>
              {data.has_explanation && data.source_observed_at ? (
                <NoMatchAttemptTimestamp iso={data.source_observed_at} />
              ) : null}
              {data.summary ? (
                <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12 }}>
                  {data.summary.total_preferences_checked} preference
                  {data.summary.total_preferences_checked === 1 ? "" : "s"} checked · {data.summary.matched} matched
                </p>
              ) : null}
              {data.rejection_breakdown.length > 0 ? (
                <div style={{ marginTop: 4 }}>
                  <p className="pf-kicker" style={{ margin: "0 0 6px", fontSize: 10 }}>
                    Rejection breakdown
                  </p>
                  <OperatorRowList density="compact">
                    {data.rejection_breakdown.map((row) => (
                      <OperatorRow
                        key={row.reason}
                        title={row.label}
                        status={
                          <span className="pf-meta-row" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {row.count}
                          </span>
                        }
                        emphasis="quiet"
                      />
                    ))}
                  </OperatorRowList>
                </div>
              ) : null}
              {data.retry_guidance ? (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(245,247,250,0.08)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <p className="pf-kicker" style={{ margin: 0, fontSize: 10 }}>
                    What to try next
                  </p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "rgba(245,247,250,0.88)" }}>
                    {data.retry_guidance.headline}
                  </p>
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
                    {data.retry_guidance.message}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 2 }}>
                    {data.retry_guidance.recommended_actions.map((a) => (
                      <MotionAction key={a.key}>
                        <Link
                          href={a.href}
                          style={actionLinkStyle(a.priority === "primary" ? "primary" : "secondary")}
                        >
                          {a.label}
                        </Link>
                      </MotionAction>
                    ))}
                  </div>
                </div>
              ) : data.guidance.length > 0 ? (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  {data.guidance.map((g) => (
                    <MotionAction key={`${g.href}-${g.title}`}>
                      <Link href={g.href} style={actionLinkStyle("secondary")}>
                        {g.title}
                      </Link>
                    </MotionAction>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      }
      status={<OperatorStatusChip kind={statusKind} label={statusLabel} caps />}
    />
  );
}
