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
  style?: CSSProperties;
};

/** Shared metric / scorecard cell (Overview, Queue summary, Outcomes, Activity strip). */
export function MetricCard({ label, value, emphasis = "default", size = "default", style }: MetricCardProps) {
  const compact = size === "compact";
  return (
    <div
      style={{
        flex: "1 1 120px",
        minWidth: compact ? 88 : 110,
        borderRadius: compact ? "var(--pf-radius-md)" : "var(--pf-radius-xl)",
        padding: compact ? "10px 12px" : "var(--pf-card-padding)",
        ...surfaceFor[emphasis],
        ...style,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: compact ? 9 : 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(245, 247, 250, 0.38)",
        }}
      >
        {label}
      </p>
      <div
        style={{
          marginTop: compact ? 6 : 12,
          fontSize: compact ? "clamp(1.1rem, 2.2vw, 1.35rem)" : "clamp(1.5rem, 3vw, 2.25rem)",
          fontWeight: 650,
          letterSpacing: "-0.04em",
          color: "var(--pf-text-primary)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
