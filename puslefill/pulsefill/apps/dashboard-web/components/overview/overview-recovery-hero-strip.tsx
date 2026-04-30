"use client";

import type { ReactNode } from "react";

const DEFAULT_TITLE = "Today's recovery";
export const DEFAULT_OVERVIEW_RECOVERY_SUBTITLE =
  "Track recovered bookings, recovered revenue, and the slots that still need attention.";

type Props = {
  /** Metric grid + optional status strip (children) */
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Small caps / eyebrow above the title (e.g. live workflow line). */
  eyebrow?: string | null;
  /** Optional right column (operational pulse, etc.) */
  aside?: ReactNode;
};

/**
 * Top-of-Overview command strip: hero framing for same-day recovery metrics.
 * @see docs — dashboard cohesion / Overview UX spec
 */
export function OverviewRecoveryHeroStrip({
  children,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_OVERVIEW_RECOVERY_SUBTITLE,
  eyebrow,
  aside,
}: Props) {
  return (
    <section
      style={{
        marginTop: 28,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.1)",
        background:
          "radial-gradient(circle at top left, rgba(255,122,24,0.07), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.045), rgba(10,9,7,0.94))",
        boxShadow: "0 22px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        padding: "24px 24px 28px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "1 1 360px", minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {eyebrow ? (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  opacity: 0.85,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>{title}</h2>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--muted)",
                  maxWidth: 640,
                }}
              >
                {subtitle}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>{children}</div>
        </div>
        {aside ? (
          <div style={{ flex: "0 1 320px", width: "100%", maxWidth: 380 }}>
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
