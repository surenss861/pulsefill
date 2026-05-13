"use client";

import { Fragment, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

export type RecoveryPipelineStepId = "opening" | "matched" | "offers" | "claim" | "confirmed";

const STEP_ORDER: RecoveryPipelineStepId[] = ["opening", "matched", "offers", "claim", "confirmed"];

const TITLES: Record<RecoveryPipelineStepId, string> = {
  opening: "Add opening",
  matched: "Find customers",
  offers: "Send offers",
  claim: "Customer claims",
  confirmed: "Confirm booking",
};

const MICRO: Record<RecoveryPipelineStepId, { full: string; short: string }> = {
  opening: { full: "Post the cancelled time.", short: "Post the time" },
  matched: { full: "PulseFill checks your waiting list.", short: "Checks waitlist" },
  offers: { full: "Customers get the opening.", short: "Customers notified" },
  claim: { full: "Someone asks for the spot.", short: "Someone asks" },
  confirmed: { full: "Your team locks it in.", short: "Team locks it in" },
};

function stepIndex(id: RecoveryPipelineStepId | undefined): number {
  if (!id) return -1;
  return STEP_ORDER.indexOf(id);
}

type StepPhase = "completed" | "active" | "pending";

function phaseFor(i: number, activeIdx: number): StepPhase {
  if (activeIdx < 0) return "pending";
  if (i < activeIdx) return "completed";
  if (i === activeIdx) return "active";
  return "pending";
}

type RecoveryPipelineProps = {
  activeStep?: RecoveryPipelineStepId;
  counts?: Partial<Record<RecoveryPipelineStepId, number>>;
  compact?: boolean;
  animated?: boolean;
  /** Stronger framing (e.g. featured rail). */
  featured?: boolean;
  /** When false, hides the “Recovery path” kicker (parent supplies its own title). */
  showFlowLabel?: boolean;
  /** Hover emphasis + optional step clicks (reduced-motion: no extra motion). */
  interactive?: boolean;
  /** Full-width overview strip: calmer active step (core workflow, not a flashy stepper). */
  workflowStrip?: boolean;
  /** Prefix step titles with 1. … 5. (pairs well with `sentenceCaseTitles` on overview). */
  stepNumbers?: boolean;
  /** Sentence-case step titles instead of all-caps labels. */
  sentenceCaseTitles?: boolean;
  onStepSelect?: (step: RecoveryPipelineStepId) => void;
  style?: CSSProperties;
};

function StepGlyph({ id, phase, calmActive }: { id: RecoveryPipelineStepId; phase: StepPhase; calmActive?: boolean }) {
  const stroke =
    phase === "active"
      ? calmActive
        ? "rgba(232, 212, 190, 0.72)"
        : "#fdba74"
      : phase === "completed"
        ? "rgba(251,191,168,0.55)"
        : "#877c72";
  const size = 18;
  const common = { width: size, height: size, flexShrink: 0 } as const;

  const paths: Record<RecoveryPipelineStepId, ReactNode> = {
    opening: (
      <svg viewBox="0 0 24 24" fill="none" style={common} aria-hidden>
        <rect x="5" y="5" width="14" height="14" rx="2" stroke={stroke} strokeWidth="1.4" />
        <path d="M8 9h8M8 12h5" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    matched: (
      <svg viewBox="0 0 24 24" fill="none" style={common} aria-hidden>
        <circle cx="12" cy="12" r="7" stroke={stroke} strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2.5" fill={phase === "pending" ? "transparent" : stroke} stroke={stroke} strokeWidth="1.2" />
      </svg>
    ),
    offers: (
      <svg viewBox="0 0 24 24" fill="none" style={common} aria-hidden>
        <path d="M6 12h10l-3-3M16 12l-3 3" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    claim: (
      <svg viewBox="0 0 24 24" fill="none" style={common} aria-hidden>
        <path
          d="M8.5 11V9a3.5 3.5 0 017 0v2M12 11v6.5M9.5 19h5"
          stroke={stroke}
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 8l2-2M18 8l-2-2" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    confirmed: (
      <svg viewBox="0 0 24 24" fill="none" style={common} aria-hidden>
        <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.4" />
        {phase === "completed" || phase === "active" ? (
          <path
            d="M8 12l2.5 2.5L16 9"
            stroke={phase === "completed" ? "rgba(251,191,168,0.9)" : calmActive ? "rgba(232, 212, 190, 0.85)" : "#fdba74"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    ),
  };

  return paths[id];
}

const btnReset: CSSProperties = {
  margin: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
  textAlign: "center" as const,
  WebkitAppearance: "none",
  appearance: "none",
};

export function RecoveryPipeline({
  activeStep,
  counts,
  compact = false,
  animated = true,
  featured = false,
  showFlowLabel = true,
  interactive = false,
  workflowStrip = false,
  stepNumbers = false,
  sentenceCaseTitles = false,
  onStepSelect,
  style,
}: RecoveryPipelineProps) {
  const reduce = useReducedMotion();
  const [hoveredStep, setHoveredStep] = useState<RecoveryPipelineStepId | null>(null);
  const activeIdx = stepIndex(activeStep);
  const runMotion = animated && !reduce;
  const micro = (id: RecoveryPipelineStepId) => (compact ? MICRO[id].short : MICRO[id].full);

  const wrapShell: CSSProperties = featured
    ? {
        ...operatorSurfaceShell("operational"),
        padding: compact ? "14px 16px" : "16px 18px",
      }
    : {
        padding: compact ? "12px 14px" : "14px 16px",
        borderRadius: "var(--pf-radius-lg)",
        border: "1px solid var(--pf-brand-border-warm-mid)",
        background:
          "linear-gradient(165deg, var(--pf-surface-tint-04), rgba(14, 12, 10, 0.94)), radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,122,24,0.04), transparent 55%)",
        boxShadow: "inset 0 1px 0 var(--pf-surface-highlight), 0 10px 28px rgba(0,0,0,0.22)",
      };

  return (
    <div className="pf-recovery-pipeline" style={{ ...wrapShell, ...style }}>
      {showFlowLabel ? (
        <p className="pf-eyebrow-plain" style={{ margin: "0 0 12px" }}>
          What happens next
        </p>
      ) : null}
      <div className="pf-recovery-pipeline-inner pf-rp-track">
        {STEP_ORDER.map((id, i) => {
          const ph = phaseFor(i, activeIdx);
          const count = counts?.[id];
          const isActive = ph === "active";
          const isDone = ph === "completed";
          const calmActive = workflowStrip && isActive;
          const sentenceTitles = sentenceCaseTitles;
          const titleText = `${stepNumbers ? `${i + 1}. ` : ""}${TITLES[id]}`;
          const ariaStep = stepNumbers ? `Step ${i + 1}: ` : "";
          const ariaLabel = `${ariaStep}${TITLES[id]} — ${MICRO[id].full}`;

          const ring = calmActive
            ? "inset 0 1px 0 rgba(255,255,255,0.04)"
            : isActive && runMotion
              ? "0 0 0 1px rgba(255,122,24,0.38), 0 0 16px rgba(255,122,24,0.14)"
              : isActive
                ? "0 0 0 1px rgba(255,122,24,0.42), 0 0 14px rgba(255,122,24,0.12)"
                : isDone
                  ? "inset 0 1px 0 var(--pf-surface-highlight)"
                  : "none";

          const nodeBg = calmActive
            ? "rgba(255, 122, 24, 0.045)"
            : isActive
              ? "radial-gradient(circle at 35% 25%, rgba(255,200,150,0.22), rgba(255,122,24,0.1))"
              : isDone
                ? "rgba(255, 122, 24, 0.06)"
                : "var(--pf-surface-tint-03)";

          const emphasize = Boolean(interactive && hoveredStep === id);
          const nodeBorder = emphasize
            ? "rgba(255, 186, 120, 0.36)"
            : calmActive
              ? "rgba(255, 140, 72, 0.26)"
              : isActive
                ? "rgba(255, 122, 24, 0.45)"
                : isDone
                  ? "rgba(255, 140, 60, 0.2)"
                  : "var(--pf-brand-border-warm)";

          const microMuted = !compact ? "var(--pf-text-muted)" : "color-mix(in srgb, var(--pf-text-muted) 92%, transparent)";
          const microStrong = !compact ? "var(--pf-text-secondary)" : "color-mix(in srgb, var(--pf-text-secondary) 95%, transparent)";
          const microColor = emphasize || isActive ? microStrong : microMuted;

          const nodeCore = (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                minWidth: sentenceTitles || stepNumbers ? 76 : compact ? 62 : 88,
                maxWidth: sentenceTitles || stepNumbers ? 136 : 120,
                padding: "10px 6px",
                borderRadius: 14,
                border: `1px solid ${nodeBorder}`,
                background: nodeBg,
                boxShadow: ring,
                transition: interactive ? "border-color 0.18s ease, box-shadow 0.18s ease" : undefined,
              }}
            >
              <StepGlyph id={id} phase={ph} calmActive={calmActive} />
              <span
                style={{
                  marginTop: 8,
                  fontSize: sentenceTitles ? (compact ? 12 : 13) : compact ? 10 : 11,
                  fontWeight: 650,
                  letterSpacing: sentenceTitles ? "0.02em" : calmActive ? "0.04em" : "0.06em",
                  textTransform: sentenceTitles ? "none" : "uppercase",
                  color: calmActive
                    ? "rgba(245, 240, 232, 0.88)"
                    : isActive
                      ? sentenceTitles
                        ? "rgba(250, 232, 210, 0.95)"
                        : "#fdba74"
                      : isDone
                        ? "var(--pf-text-tertiary)"
                        : "var(--pf-text-muted)",
                }}
              >
                {titleText}
              </span>
              {!compact ? (
                <span style={{ marginTop: 5, fontSize: 11, lineHeight: 1.35, color: microColor, fontWeight: 500 }}>
                  {micro(id)}
                </span>
              ) : (
                <span style={{ marginTop: 4, fontSize: 10, lineHeight: 1.3, color: microColor }}>{micro(id)}</span>
              )}
              {count != null && count > 0 ? (
                <span style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "rgba(255,186,120,0.95)", letterSpacing: "-0.02em" }}>{count}</span>
              ) : null}
            </div>
          );

          const node =
            interactive && onStepSelect ? (
              <button
                type="button"
                style={{ ...btnReset, display: "flex", justifyContent: "center", borderRadius: 16 }}
                onClick={() => onStepSelect(id)}
                aria-label={ariaLabel}
              >
                {nodeCore}
              </button>
            ) : interactive ? (
              <div
                role="group"
                title={MICRO[id].full}
                onMouseEnter={() => setHoveredStep(id)}
                onMouseLeave={() => setHoveredStep((h) => (h === id ? null : h))}
                style={{ display: "flex", justifyContent: "center", borderRadius: 16, cursor: "default" }}
              >
                {nodeCore}
              </div>
            ) : (
              nodeCore
            );

          const pulseActive = isActive && runMotion && !interactive && !workflowStrip;
          const wrappedNode = runMotion ? (
            <motion.div
              key={`n-${id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: "0 0 auto" }}
            >
              {pulseActive ? (
                <motion.div animate={{ opacity: [1, 0.92, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
                  {node}
                </motion.div>
              ) : (
                node
              )}
            </motion.div>
          ) : (
            <div key={`n-${id}`} style={{ flex: "0 0 auto" }}>
              {node}
            </div>
          );

          const hotConnector = activeIdx >= 0 && i < activeIdx;
          const sweep = hotConnector && runMotion && animated;
          const desktopConnClass = [
            "pf-rp-conn",
            "pf-rp-conn--desktop",
            hotConnector ? "pf-rp-conn--hot" : "",
            sweep ? "pf-rp-conn--animate" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const desktopConnStyle: CSSProperties = {
            flex: "1 1 12px",
            height: 3,
            minWidth: 8,
            maxWidth: 48,
            borderRadius: 2,
            alignSelf: "center",
            transformOrigin: "left center",
            ...(sweep
              ? {}
              : hotConnector
                ? workflowStrip
                  ? {
                      background: "linear-gradient(90deg, rgba(255,122,24,0.22), rgba(255,122,24,0.06))",
                      boxShadow: "none",
                    }
                  : {
                      background: "linear-gradient(90deg, rgba(255,122,24,0.45), rgba(255,122,24,0.1))",
                      boxShadow: "0 0 10px rgba(255,122,24,0.1)",
                    }
                : {
                    background: "linear-gradient(90deg, var(--pf-surface-tint-07), var(--pf-surface-tint-03))",
                  }),
          };

          const connectorDesktop = runMotion ? (
            <motion.div
              key={`cd-${id}`}
              className={desktopConnClass}
              initial={{ scaleX: 0.15, opacity: 0.4 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.12 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={desktopConnStyle}
            />
          ) : (
            <div key={`cd-${id}`} className={desktopConnClass} style={desktopConnStyle} />
          );

          const mobileConnClass = ["pf-rp-conn", "pf-rp-conn--mobile", hotConnector ? "pf-rp-conn--hot" : "", sweep ? "pf-rp-conn--animate" : ""]
            .filter(Boolean)
            .join(" ");

          const connectorMobile = (
            <div
              key={`cm-${id}`}
              className={mobileConnClass}
              style={{
                width: "100%",
                height: 2,
                borderRadius: 1,
                margin: "4px 0",
                ...(sweep
                  ? {}
                  : hotConnector
                    ? workflowStrip
                      ? {
                          background: "linear-gradient(90deg, rgba(255,122,24,0.2), rgba(255,122,24,0.05))",
                        }
                      : {
                          background: "linear-gradient(90deg, rgba(255,122,24,0.45), rgba(255,122,24,0.08))",
                        }
                    : { background: "var(--pf-surface-tint-06)" }),
              }}
            />
          );

          return (
            <Fragment key={id}>
              {wrappedNode}
              {i < STEP_ORDER.length - 1 ? (
                <>
                  {connectorDesktop}
                  {connectorMobile}
                </>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
