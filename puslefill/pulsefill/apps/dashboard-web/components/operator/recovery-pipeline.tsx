"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

export type RecoveryPipelineStepId = "opening" | "matched" | "offers" | "claim" | "confirmed";

const STEP_ORDER: RecoveryPipelineStepId[] = ["opening", "matched", "offers", "claim", "confirmed"];

const LABELS: Record<RecoveryPipelineStepId, string> = {
  opening: "Opening",
  matched: "Standby match",
  offers: "Offers sent",
  claim: "Claim",
  confirmed: "Confirmed",
};

function stepIndex(id: RecoveryPipelineStepId | undefined): number {
  if (!id) return -1;
  return STEP_ORDER.indexOf(id);
}

type RecoveryPipelineProps = {
  activeStep?: RecoveryPipelineStepId;
  counts?: Partial<Record<RecoveryPipelineStepId, number>>;
  compact?: boolean;
  animated?: boolean;
  style?: CSSProperties;
};

const nodeBase: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
};

export function RecoveryPipeline({ activeStep, counts, compact = false, animated = true, style }: RecoveryPipelineProps) {
  const reduce = useReducedMotion();
  const activeIdx = stepIndex(activeStep);
  const runMotion = animated && !reduce;
  const font = compact ? 10 : 11;
  const labelMuted = "rgba(245,247,250,0.48)";

  return (
    <div
      className="pf-recovery-pipeline"
      style={{
        padding: compact ? "12px 14px" : "14px 16px",
        borderRadius: "var(--pf-radius-lg)",
        border: "1px solid var(--pf-border-subtle)",
        background: "linear-gradient(165deg, rgba(20,18,16,0.95), rgba(10,9,8,0.92))",
        ...style,
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(245,247,250,0.36)",
        }}
      >
        Recovery flow
      </p>
      <div className="pf-recovery-pipeline-inner">
        {STEP_ORDER.map((id, i) => {
          const done = activeIdx >= i;
          const active = activeIdx === i;
          const count = counts?.[id];
          const nodeStyle: CSSProperties = {
            ...nodeBase,
            borderColor: active
              ? "rgba(255, 122, 24, 0.55)"
              : done
                ? "rgba(255, 122, 24, 0.22)"
                : "rgba(255,255,255,0.1)",
            background: active
              ? "radial-gradient(circle at 30% 30%, rgba(255,186,120,0.35), rgba(255,122,24,0.2))"
              : done
                ? "rgba(255, 122, 24, 0.08)"
                : "rgba(255,255,255,0.03)",
            boxShadow: active ? "0 0 16px rgba(255, 122, 24, 0.28)" : "none",
          };

          const label = (
            <span
              style={{
                display: "block",
                marginTop: 6,
                fontSize: font,
                fontWeight: 600,
                color: active ? "#fdba74" : labelMuted,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                textAlign: "center",
                maxWidth: 76,
                lineHeight: 1.25,
              }}
            >
              {LABELS[id]}
              {count != null && count > 0 ? (
                <span style={{ display: "block", marginTop: 3, fontSize: 10, color: "rgba(245,247,250,0.55)", fontWeight: 650 }}>{count}</span>
              ) : null}
            </span>
          );

          const connector =
            i < STEP_ORDER.length - 1 ? (
              <div
                className="pf-recovery-pipeline-connector"
                style={{
                  flex: "1 1 10px",
                  height: 2,
                  minWidth: 6,
                  maxWidth: 40,
                  borderRadius: 1,
                  background:
                    activeIdx > i
                      ? "linear-gradient(90deg, rgba(255,122,24,0.35), rgba(255,122,24,0.1))"
                      : "rgba(255,255,255,0.06)",
                  alignSelf: "center",
                }}
              />
            ) : null;

          const column = (
            <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto", minWidth: 0 }}>
              {runMotion ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={nodeStyle}
                />
              ) : (
                <div style={nodeStyle} />
              )}
              {label}
            </div>
          );

          return (
            <Fragment key={id}>
              {column}
              {connector}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
