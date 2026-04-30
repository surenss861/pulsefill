"use client";

import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type AuthBrandPanelProps = {
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
  /** When true, shows the product RecoveryPipeline (replaces legacy fake metrics strip). */
  showRecoveryPipeline?: boolean;
  /** Highlighted step for the story panel. Omit for an idle (all-pending) pipeline — useful on error screens. */
  recoveryActiveStep?: RecoveryPipelineStepId;
};

export function AuthBrandPanel({
  eyebrow = "Cancellation recovery infrastructure",
  title,
  body,
  bullets = ["Queue visibility", "Explainable actions", "Recovery signals live"],
  showRecoveryPipeline = true,
  recoveryActiveStep,
}: AuthBrandPanelProps) {
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div style={{ display: "grid", gap: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--pf-accent-primary)",
              boxShadow: "0 0 18px rgba(255, 122, 24, 0.55)",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.18em", color: "rgba(245,242,237,0.9)" }}>
            PulseFill
          </span>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <p className="pf-kicker" style={{ margin: 0, color: "rgba(245,242,237,0.48)" }}>
            {eyebrow}
          </p>
          <h1
            style={{
              margin: 0,
              maxWidth: "14ch",
              fontSize: "clamp(36px, 3.8vw, 64px)",
              fontWeight: 620,
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              color: "var(--text)",
            }}
          >
            {title}
          </h1>
          <p className="pf-muted-copy" style={{ margin: 0, maxWidth: "34rem", fontSize: 16, lineHeight: 1.65 }}>
            {body}
          </p>
        </div>
      </div>

      {bullets.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {bullets.map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 14,
                ...operatorSurfaceShell("quiet"),
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--pf-accent-primary)",
                  flexShrink: 0,
                  boxShadow: "0 0 10px rgba(255,122,24,0.35)",
                }}
              />
              <span style={{ fontSize: 14, color: "rgba(245,242,237,0.84)" }}>{item}</span>
            </div>
          ))}
        </div>
      ) : null}

      {showRecoveryPipeline ? (
        <div style={{ padding: "16px 14px", ...operatorSurfaceShell("operational") }}>
          <p className="pf-kicker" style={{ margin: "0 0 10px" }}>
            Recovery path
          </p>
          <RecoveryPipeline
            activeStep={recoveryActiveStep}
            compact
            animated
            showFlowLabel={false}
            style={{ margin: 0, padding: "10px 8px", boxShadow: "none", border: "none", background: "transparent" }}
          />
        </div>
      ) : null}
    </div>
  );
}
