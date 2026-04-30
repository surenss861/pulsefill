"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
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
  setup: "Setup required",
  ready: "Ready",
  clear: "All clear",
};

/** Left label in the system header row. */
const DEFAULT_SYSTEM_HEADER = "System recommendation";

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
  critical: "4px 0 36px rgba(255,72,40,0.22), 0 0 28px rgba(185,45,35,0.08)",
  attention: "4px 0 28px rgba(255,122,24,0.18)",
  setup: "3px 0 20px rgba(255,160,70,0.12)",
  ready: "2px 0 14px rgba(255,140,60,0.08)",
  clear: "none",
};

/** Merged onto base `nextBestAction` shell for priority mood. */
const SHELL_MOOD: Record<NextBestActionPriority, CSSProperties> = {
  critical: {
    border: "1px solid rgba(255,120,90,0.22)",
    boxShadow:
      "0 32px 80px rgba(0,0,0,0.48), 0 0 0 1px rgba(185,55,45,0.12), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255, 122, 24, 0.06)",
  },
  attention: {
    border: "1px solid rgba(255,140,80,0.16)",
    boxShadow:
      "0 28px 76px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.065), 0 0 40px rgba(255,122,24,0.06)",
  },
  setup: {
    border: "1px solid rgba(255,180,100,0.14)",
    boxShadow: "0 24px 68px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  ready: {
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 20px 58px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.055)",
  },
  clear: {
    border: "1px solid rgba(255,255,255,0.065)",
    background:
      "linear-gradient(118deg, rgba(14,13,12,0.98) 0%, rgba(8,8,7,0.99) 50%), radial-gradient(ellipse 60% 80% at 0% 30%, rgba(255,122,24,0.03), transparent 55%)",
    boxShadow: "0 14px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
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
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,200,150,0.15)",
    color: "rgba(245,247,250,0.75)",
  },
  clear: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(245,247,250,0.5)",
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
      return { label: "rgba(245,247,250,0.38)", value: "rgba(255, 200, 150, 0.92)" };
    case "live":
      return { label: "rgba(245,247,250,0.34)", value: "rgba(254, 200, 160, 0.88)" };
    case "idle":
    default:
      return { label: "rgba(245,247,250,0.28)", value: "rgba(245,247,250,0.38)" };
  }
}

type NextBestActionCardProps = {
  /** Stable id for Framer when the recommendation changes (e.g. `claim`, `standby-3`). */
  actionKey: string;
  title: string;
  description: string;
  /** Left side of the system header row (default: “System recommendation”). */
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
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                paddingBottom: 14,
                marginBottom: 4,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
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

            <h2 className="pf-page-title" style={{ margin: "12px 0 0", maxWidth: 640 }}>
              {title}
            </h2>
            <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 15, maxWidth: 620 }}>
              {description}
            </p>
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
              <div style={{ flex: "0 1 auto" }}>{primaryAction}</div>
              {supportingStats && supportingStats.length > 0 ? (
                <div
                  style={{
                    flex: "1 1 200px",
                    minWidth: 0,
                    fontSize: 12,
                    lineHeight: 1.45,
                    textAlign: "right" as const,
                    color: "rgba(245,247,250,0.32)",
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
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <RecoveryPipeline activeStep={pipelineStep} compact animated={!reduce} featured={false} />
              </div>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
