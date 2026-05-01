import type { CSSProperties, ReactNode } from "react";

export type MetricCardEmphasis = "default" | "primary" | "danger";

const surfaceFor: Record<MetricCardEmphasis, CSSProperties> = {
  primary: {
    border: "1px solid var(--pf-accent-primary-border)",
    background:
      "linear-gradient(180deg, rgba(255, 122, 26, 0.11), rgba(255,255,255,0.02)), var(--pf-bg-surface)",
  },
  danger: {
    border: "1px solid var(--pf-accent-secondary-border)",
    background:
      "linear-gradient(180deg, rgba(201, 59, 47, 0.12), rgba(255,255,255,0.02)), var(--pf-bg-surface)",
  },
  default: {
    border: "1px solid var(--pf-border-subtle)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.032), rgba(255,122,24,0.01)), var(--pf-bg-surface)",
  },
};

type MetricCardProps = {
  label: string;
  value: ReactNode;
  emphasis?: MetricCardEmphasis;
  /** Tighter strip for zero / low-signal dashboards (e.g. Activity). */
  size?: "default" | "compact";
  /** Muted “idle” treatment for zero / non-actionable values. */
  signal?: "idle" | "live";
  hint?: ReactNode;
  style?: CSSProperties;
};

const idleOverlay: CSSProperties = {
  opacity: 0.82,
  filter: "saturate(0.72)",
};

/** Shared metric / scorecard cell (Overview, Queue summary, Outcomes, Activity strip). */
export function MetricCard({
  label,
  value,
  emphasis = "default",
  size = "default",
  signal = "live",
  hint,
  style,
}: MetricCardProps) {
  const compact = size === "compact";
  const idle = signal === "idle";
  return (
    <div
      style={{
        flex: "1 1 120px",
        minWidth: compact ? 88 : 110,
        borderRadius: compact ? "var(--pf-radius-md)" : "var(--pf-radius-xl)",
        padding: compact ? "10px 12px" : "var(--pf-card-padding)",
        ...surfaceFor[emphasis],
        ...(idle ? idleOverlay : {}),
        ...style,
      }}
    >
      <p className="pf-kicker" style={{ letterSpacing: "0.18em", fontSize: compact ? 9 : 10 }}>
        {label}
      </p>
      <div
        className="pf-stat-value"
        style={{
          marginTop: compact ? 6 : 12,
          fontSize: compact ? "clamp(1.05rem, 2vw, 1.28rem)" : "clamp(1.45rem, 3vw, 2.2rem)",
          color: idle ? "rgba(245,247,250,0.52)" : "var(--pf-text-primary)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {hint ? (
        <p className="pf-meta-row" style={{ margin: compact ? "6px 0 0" : "8px 0 0", lineHeight: 1.35 }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
