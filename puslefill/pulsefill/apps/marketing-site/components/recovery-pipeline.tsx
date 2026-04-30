"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "../lib/operator-surface-styles";

export type RecoveryPipelineStepId = "opening" | "matched" | "offers" | "claim" | "confirmed";

const STEP_ORDER: RecoveryPipelineStepId[] = ["opening", "matched", "offers", "claim", "confirmed"];

const TITLES: Record<RecoveryPipelineStepId, string> = {
  opening: "Opening",
  matched: "Match",
  offers: "Offers",
  claim: "Claim",
  confirmed: "Confirm",
};

const MICRO: Record<RecoveryPipelineStepId, { full: string; short: string }> = {
  opening: { full: "Cancelled time captured", short: "Time captured" },
  matched: { full: "Standby pool scanned", short: "Pool scanned" },
  offers: { full: "Customers notified", short: "Notified" },
  claim: { full: "Customer raised hand", short: "Raised hand" },
  confirmed: { full: "Booking recovered", short: "Recovered" },
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
  featured?: boolean;
  showFlowLabel?: boolean;
  style?: CSSProperties;
};

function StepGlyph({ id, phase }: { id: RecoveryPipelineStepId; phase: StepPhase }) {
  const stroke =
    phase === "active" ? "#fdba74" : phase === "completed" ? "rgba(251,191,168,0.55)" : "rgba(245,247,250,0.22)";
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
            stroke={phase === "completed" ? "rgba(251,191,168,0.9)" : "#fdba74"}
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

export function RecoveryPipeline({
  activeStep,
  counts,
  compact = false,
  animated = true,
  featured = false,
  showFlowLabel = true,
  style,
}: RecoveryPipelineProps) {
  const reduce = useReducedMotion();
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
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.1)",
        background:
          "linear-gradient(165deg, rgba(22,19,17,0.98), rgba(8,7,6,0.96)), radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,122,24,0.06), transparent 55%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 36px rgba(0,0,0,0.28)",
      };

  return (
    <div className="pf-recovery-pipeline" style={{ ...wrapShell, ...style }}>
      {showFlowLabel ? (
        <p className="pf-kicker" style={{ margin: "0 0 12px" }}>
          Recovery flow
        </p>
      ) : null}
      <div className="pf-recovery-pipeline-inner pf-rp-track">
        {STEP_ORDER.map((id, i) => {
          const ph = phaseFor(i, activeIdx);
          const count = counts?.[id];
          const isActive = ph === "active";
          const isDone = ph === "completed";

          const ring =
            isActive && runMotion
              ? "0 0 0 1px rgba(255,122,24,0.45), 0 0 22px rgba(255,122,24,0.22)"
              : isActive
                ? "0 0 0 1px rgba(255,122,24,0.5), 0 0 18px rgba(255,122,24,0.2)"
                : isDone
                  ? "inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "none";

          const nodeBg = isActive
            ? "radial-gradient(circle at 35% 25%, rgba(255,200,150,0.25), rgba(255,122,24,0.12))"
            : isDone
              ? "rgba(255, 122, 24, 0.07)"
              : "rgba(255,255,255,0.02)";

          const nodeBorder = isActive ? "rgba(255, 122, 24, 0.55)" : isDone ? "rgba(255, 140, 60, 0.22)" : "rgba(255,255,255,0.08)";

          const node = (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                minWidth: compact ? 72 : 88,
                maxWidth: 120,
                padding: "10px 6px",
                borderRadius: 14,
                border: `1px solid ${nodeBorder}`,
                background: nodeBg,
                boxShadow: ring,
              }}
            >
              <StepGlyph id={id} phase={ph} />
              <span
                style={{
                  marginTop: 8,
                  fontSize: compact ? 10 : 11,
                  fontWeight: 650,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isActive ? "#fdba74" : isDone ? "rgba(254, 215, 170, 0.75)" : "rgba(245,247,250,0.42)",
                }}
              >
                {TITLES[id]}
              </span>
              {!compact ? (
                <span style={{ marginTop: 5, fontSize: 11, lineHeight: 1.35, color: "rgba(245,247,250,0.45)", fontWeight: 500 }}>
                  {micro(id)}
                </span>
              ) : (
                <span style={{ marginTop: 4, fontSize: 10, lineHeight: 1.3, color: "rgba(245,247,250,0.38)" }}>{micro(id)}</span>
              )}
              {count != null && count > 0 ? (
                <span style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "rgba(255,186,120,0.95)", letterSpacing: "-0.02em" }}>
                  {count}
                </span>
              ) : null}
            </div>
          );

          const wrappedNode = runMotion ? (
            <motion.div
              key={`n-${id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: "0 0 auto" }}
            >
              {isActive ? (
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
          const desktopConnClass = ["pf-rp-conn", "pf-rp-conn--desktop", hotConnector ? "pf-rp-conn--hot" : "", sweep ? "pf-rp-conn--animate" : ""]
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
                ? {
                    background: "linear-gradient(90deg, rgba(255,122,24,0.55), rgba(255,122,24,0.12))",
                    boxShadow: "0 0 12px rgba(255,122,24,0.15)",
                  }
                : {
                    background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
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
                    ? {
                        background: "linear-gradient(90deg, rgba(255,122,24,0.45), rgba(255,122,24,0.08))",
                      }
                    : { background: "rgba(255,255,255,0.06)" }),
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
