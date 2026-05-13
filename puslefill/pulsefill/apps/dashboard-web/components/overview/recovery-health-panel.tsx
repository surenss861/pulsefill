"use client";

import Link from "next/link";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorStatusChip, type OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import type { RecoveryHealthOverallStatus, RecoveryHealthResponse, RecoveryHealthSignal } from "@/types/recovery-health";

function formatEvaluatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  if (diffMs >= 0 && diffMs < 90_000) return "just now";
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function overallChipKind(status: RecoveryHealthOverallStatus): OperatorStatusKind {
  if (status === "ready") return "confirmed";
  if (status === "setup_required") return "setup";
  if (status === "low_coverage") return "inactive";
  return "attention";
}

function overallChipLabel(status: RecoveryHealthOverallStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "needs_attention":
      return "Needs attention";
    case "setup_required":
      return "Needs setup";
    case "low_coverage":
      return "Low coverage";
    default:
      return status;
  }
}

function panelPriorityShell(status: RecoveryHealthOverallStatus) {
  if (status === "ready") return operatorSurfaceShell("quiet");
  if (status === "setup_required") return operatorSurfaceShell("operational");
  return operatorSurfaceShell("operational");
}

function signalRowChipKind(st: RecoveryHealthSignal["status"]): OperatorStatusKind {
  if (st === "ready") return "confirmed";
  if (st === "setup_required") return "setup";
  if (st === "low_coverage") return "inactive";
  return "attention";
}

function signalRowChipCaption(st: RecoveryHealthSignal["status"]): string {
  if (st === "ready") return "OK";
  if (st === "setup_required") return "Setup";
  if (st === "low_coverage") return "Low";
  return "Review";
}

type Props = {
  data: RecoveryHealthResponse | null;
  loading: boolean;
  error: string | null;
  /** Refetch after a failed load (shown as Retry on the friendly error card). */
  onReload?: () => void;
};

export function RecoveryHealthPanel({ data, loading, error, onReload }: Props) {
  if (loading) {
    return <OperatorLoadingState variant="section" title="Loading recovery status…" skeleton="rows" />;
  }
  if (error) {
    return (
      <OperatorErrorState
        title="Recovery status did not load"
        description="Try again. Your openings and customers are still safe."
        primaryAction={
          <button
            type="button"
            onClick={() => void onReload?.()}
            style={{
              ...actionLinkStyle("secondary"),
              border: "1px solid var(--pf-brand-border-warm-mid)",
              background: "var(--pf-surface-tint-05)",
              padding: "8px 14px",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Retry loading status
          </button>
        }
        compact
      />
    );
  }
  if (!data) {
    return null;
  }

  const rows: RecoveryHealthSignal[] = [
    data.signals.setup,
    data.signals.standby_pool,
    data.signals.notification_reach,
    data.signals.recent_matching,
    data.signals.claims,
  ];

  const evaluatedWhen =
    data.evaluated_at.trim().length > 0
      ? (() => {
          const ev = formatEvaluatedAt(data.evaluated_at);
          return ev === "just now" ? "just now" : `at ${ev}`;
        })()
      : null;

  const shell = panelPriorityShell(data.status);
  const borderAccent =
    data.status !== "ready"
      ? { borderColor: "rgba(255, 122, 24, 0.22)" }
      : { borderColor: "rgba(255,255,255,0.08)" };

  return (
    <section className="pf-operator-action-panel" style={{ padding: 16, ...shell, ...borderAccent }}>
      <p className="pf-eyebrow-plain" style={{ margin: "0 0 8px" }}>
        Recovery status
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: "1 1 200px" }}>
          <h2 className="pf-section-title" style={{ fontSize: 16, margin: 0 }}>
            {data.headline}
          </h2>
          <div className="pf-muted-copy" style={{ marginTop: 8, fontSize: 13 }}>
            {data.message}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <OperatorStatusChip kind={overallChipKind(data.status)} label={overallChipLabel(data.status)} />
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              ...operatorSurfaceShell("quiet"),
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ minWidth: 0, flex: "1 1 160px" }}>
              <div className="pf-meta-row" style={{ fontSize: 11, opacity: 0.65, fontWeight: 600 }}>
                {row.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 650, marginTop: 4, color: "var(--pf-text-primary)" }}>{row.value}</div>
              <div className="pf-muted-copy" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
                {row.details}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <OperatorStatusChip kind={signalRowChipKind(row.status)} label={signalRowChipCaption(row.status)} />
            </div>
          </div>
        ))}
      </div>

      {data.readiness.fixes.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <div className="pf-meta-row" style={{ fontSize: 11, opacity: 0.72, fontWeight: 600, marginBottom: 8 }}>
            Fix readiness
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {data.readiness.fixes.map((fix) => (
              <MotionAction key={fix.key}>
                <Link
                  href={fix.href}
                  style={{
                    ...actionLinkStyle("secondary"),
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span aria-hidden style={{ opacity: 0.55 }}>
                    →
                  </span>
                  {fix.title}
                </Link>
              </MotionAction>
            ))}
          </div>
        </div>
      ) : null}

      {data.next_actions.length > 0 ? (
        <div
          className="pf-operator-action-panel__actions"
          style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}
        >
          {data.next_actions.slice(0, 2).map((a, i) => (
            <MotionAction key={`${a.href}:${a.label}`}>
              <Link href={a.href} style={actionLinkStyle(i === 0 ? "primary" : "secondary")}>
                {a.label}
              </Link>
            </MotionAction>
          ))}
        </div>
      ) : null}

      {data.status === "ready" ? (
        <p className="pf-muted-copy" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.45 }}>
          Nothing urgent in this snapshot — check the card at the top for what to do next.
        </p>
      ) : null}

      {evaluatedWhen ? (
        <p className="pf-muted-copy" style={{ marginTop: 10, fontSize: 11, opacity: 0.72, lineHeight: 1.45 }}>
          Last evaluated {evaluatedWhen} · Updates when you refresh this page.
        </p>
      ) : null}
    </section>
  );
}
