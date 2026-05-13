"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

const easeOut = [0.22, 1, 0.36, 1] as const;

export type NextBestActionPriority = "critical" | "attention" | "setup" | "ready" | "clear";

export type NextBestSupportingStatTone = "idle" | "live" | "attention";

export type NextBestSupportingStat = {
  label: string;
  value: string | number;
  tone?: NextBestSupportingStatTone;
};

const PRIORITY_STATUS: Record<NextBestActionPriority, string> = {
  critical: "Needs decision",
  attention: "Needs review",
  setup: "Basics to finish",
  ready: "Ready",
  clear: "All clear",
};

/** Left label in the system header row. */
const DEFAULT_SYSTEM_HEADER = "Setup needed";

const RAIL: Record<NextBestActionPriority, string> = {
  critical:
    "linear-gradient(180deg, rgba(255,120,95,0.98) 0%, rgba(220,72,50,0.75) 35%, rgba(255,122,24,0.45) 70%, rgba(90,28,18,0.5))",
  attention: "linear-gradient(180deg, rgba(255,196,140,0.9), rgba(255,122,24,0.5) 45%, rgba(255,122,24,0.15))",
  setup: "linear-gradient(180deg, rgba(255,210,150,0.75), rgba(245,170,80,0.35) 50%, rgba(255,122,24,0.12))",
  ready: "linear-gradient(180deg, rgba(255,200,160,0.45), rgba(255,122,24,0.22) 55%, rgba(255,255,255,0.04))",
  clear: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.02))",
};

const RAIL_WIDTH: Record<NextBestActionPriority, number> = {
  critical: 6,
  attention: 5,
  setup: 5,
  ready: 4,
  clear: 3,
};

const RAIL_GLOW: Record<NextBestActionPriority, string> = {
  critical: "3px 0 26px rgba(255,72,40,0.14), 0 0 18px rgba(185,45,35,0.06)",
  attention: "3px 0 20px rgba(255,122,24,0.12)",
  setup: "2px 0 16px rgba(255,160,70,0.09)",
  ready: "2px 0 12px rgba(255,140,60,0.06)",
  clear: "none",
};

/** Merged onto base `nextBestAction` shell for priority mood. */
const SHELL_MOOD: Record<NextBestActionPriority, CSSProperties> = {
  critical: {
    border: "1px solid rgba(255,120,90,0.2)",
    boxShadow:
      "0 28px 72px rgba(0,0,0,0.42), 0 0 0 1px rgba(185,55,45,0.1), inset 0 1px 0 var(--pf-surface-highlight), inset 0 0 0 1px rgba(255, 122, 24, 0.05)",
  },
  attention: {
    border: "1px solid rgba(255,140,80,0.14)",
    boxShadow:
      "0 26px 68px rgba(0,0,0,0.4), inset 0 1px 0 var(--pf-surface-highlight), 0 0 28px rgba(255,122,24,0.04)",
  },
  setup: {
    border: "1px solid rgba(255,180,100,0.12)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.36), inset 0 1px 0 var(--pf-surface-highlight)",
  },
  ready: {
    border: "1px solid var(--pf-brand-border-warm-mid)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.32), inset 0 1px 0 var(--pf-surface-highlight)",
  },
  clear: {
    border: "1px solid var(--pf-brand-border-warm)",
    background:
      "linear-gradient(118deg, rgba(20,16,13,0.98) 0%, rgba(12,10,8,0.99) 50%), radial-gradient(ellipse 60% 80% at 0% 30%, rgba(255,122,24,0.025), transparent 55%)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.24), inset 0 1px 0 var(--pf-surface-highlight)",
  },
};

const CHIP: Record<NextBestActionPriority, CSSProperties> = {
  critical: {
    background: "rgba(185,45,35,0.2)",
    border: "1px solid rgba(255,120,95,0.35)",
    color: "rgba(255,210,200,0.95)",
  },
  attention: {
    background: "rgba(255,122,24,0.14)",
    border: "1px solid rgba(255,160,90,0.28)",
    color: "rgba(254, 215, 170, 0.95)",
  },
  setup: {
    background: "rgba(255,170,80,0.12)",
    border: "1px solid rgba(230,160,90,0.22)",
    color: "rgba(255, 220, 180, 0.9)",
  },
  ready: {
    background: "var(--pf-surface-tint-05)",
    border: "1px solid var(--pf-brand-border-warm-mid)",
    color: "var(--pf-text-secondary)",
  },
  clear: {
    background: "var(--pf-surface-tint-04)",
    border: "1px solid var(--pf-brand-border-warm)",
    color: "var(--pf-text-muted)",
  },
};

function formatUpdatedAt(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "Updated just now";
  if (sec < 90) return "Updated 1 min ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Updated ${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Updated ${hr}h ago`;
  return "Updated earlier";
}

function statInlineColors(tone: NextBestSupportingStatTone | undefined): { label: string; value: string } {
  switch (tone) {
    case "attention":
      return { label: "var(--pf-text-muted)", value: "var(--pf-accent-primary-hover)" };
    case "live":
      return { label: "var(--pf-text-muted)", value: "var(--pf-brand-text)" };
    case "idle":
    default:
      return { label: "var(--pf-brand-text-faint)", value: "var(--pf-text-secondary)" };
  }
}

type NextBestActionCardProps = {
  /** Stable id for Framer when the recommendation changes (e.g. `claim`, `standby-3`). */
  actionKey: string;
  title: string;
  description: string;
  /** Left side of the system header row (default: “Setup needed”). */
  systemHeaderLabel?: string;
  priority: NextBestActionPriority;
  primaryAction: ReactNode;
  secondaryMeta?: ReactNode;
  pipelineStep?: RecoveryPipelineStepId;
  supportingStats?: readonly NextBestSupportingStat[];
  /** When true (default), shows a compact `RecoveryPipeline` under the stats row when `pipelineStep` is set. */
  showPipeline?: boolean;
  /** When set, shown in the header row (e.g. last refresh time). */
  updatedAt?: Date | null;
  style?: CSSProperties;
};

export function NextBestActionCard({
  actionKey,
  title,
  description,
  systemHeaderLabel = DEFAULT_SYSTEM_HEADER,
  priority,
  primaryAction,
  secondaryMeta,
  pipelineStep,
  supportingStats,
  showPipeline = true,
  updatedAt,
  style,
}: NextBestActionCardProps) {
  const reduce = useReducedMotion();
  const baseShell = operatorSurfaceShell("nextBestAction");
  const moodShell = SHELL_MOOD[priority];
  const shell: CSSProperties = { ...baseShell, ...moodShell };
  const showRecovery = Boolean(showPipeline && pipelineStep);
  const rw = RAIL_WIDTH[priority];
  const quietSetupHeader = priority === "setup";

  return (
    <div className={`pf-next-best-action pf-next-best-action--${priority}`} style={{ ...style }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={actionKey}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.26, ease: easeOut }}
          style={{
            position: "relative",
            overflow: "hidden",
            ...shell,
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: rw,
              background: RAIL[priority],
              boxShadow: RAIL_GLOW[priority],
            }}
          />
          <div className="pf-next-best-action__body">
            {quietSetupHeader ? null : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  paddingBottom: 14,
                  marginBottom: 4,
                  borderBottom: "1px solid var(--pf-brand-border-warm)",
                }}
              >
                <span className="pf-kicker">{systemHeaderLabel}</span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                  {updatedAt ? <span className="pf-meta-row">{formatUpdatedAt(updatedAt)}</span> : null}
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 650,
                      letterSpacing: "0.04em",
                      padding: "4px 10px",
                      borderRadius: 999,
                      ...CHIP[priority],
                    }}
                  >
                    {PRIORITY_STATUS[priority]}
                  </span>
                </div>
              </div>
            )}

            <h2 className="pf-page-title" style={{ margin: quietSetupHeader ? "0 0 0" : "12px 0 0", maxWidth: 640 }}>
              {title}
            </h2>
            <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 15, maxWidth: 620 }}>
              {description}
            </p>
            {quietSetupHeader && updatedAt ? (
              <p className="pf-meta-row" style={{ margin: "8px 0 0", fontSize: 12 }}>
                {formatUpdatedAt(updatedAt)}
              </p>
            ) : null}
            {secondaryMeta ? (
              <div className="pf-muted-copy" style={{ marginTop: 10, fontSize: 13 }}>
                {secondaryMeta}
              </div>
            ) : null}

            <div
              style={{
                marginTop: 18,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 14,
                rowGap: 12,
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: "0 1 auto" }}>
                <MotionAction>{primaryAction}</MotionAction>
              </div>
              {supportingStats && supportingStats.length > 0 ? (
                <div
                  style={{
                    flex: "1 1 200px",
                    minWidth: 0,
                    fontSize: 12,
                    lineHeight: 1.45,
                    textAlign: "right" as const,
                    color: "var(--pf-text-muted)",
                  }}
                >
                  {supportingStats.map((s, i) => {
                    const c = statInlineColors(s.tone);
                    return (
                      <span key={`${s.label}-${String(s.value)}`}>
                        {i > 0 ? <span style={{ margin: "0 0.35em", opacity: 0.45 }}>·</span> : null}
                        <span style={{ color: c.label }}>{s.label}: </span>
                        <span style={{ color: c.value, fontWeight: 650 }}>{s.value}</span>
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {showRecovery && pipelineStep ? (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--pf-brand-border-warm)" }}>
                <RecoveryPipeline activeStep={pipelineStep} compact animated={!reduce} featured={false} />
              </div>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
