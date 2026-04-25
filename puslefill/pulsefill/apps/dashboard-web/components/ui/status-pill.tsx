import type { CSSProperties, ReactNode } from "react";

export type StatusPillVariant = "default" | "primary" | "danger" | "resolved" | "muted";

const variantStyle: Record<StatusPillVariant, CSSProperties> = {
  primary: {
    background: "var(--pf-accent-primary-soft)",
    color: "var(--pf-chip-primary-text)",
    border: "1px solid var(--pf-accent-primary-border)",
  },
  danger: {
    background: "var(--pf-danger-soft)",
    color: "var(--pf-chip-danger-text)",
    border: "1px solid var(--pf-danger-border)",
  },
  resolved: {
    background: "rgba(255,255,255,0.04)",
    color: "rgba(245, 247, 250, 0.52)",
    border: "1px solid var(--pf-border-subtle)",
  },
  muted: {
    background: "rgba(255,255,255,0.04)",
    color: "rgba(245, 247, 250, 0.42)",
    border: "1px solid var(--pf-border-subtle)",
  },
  default: {
    background: "var(--pf-chip-neutral-bg)",
    color: "var(--pf-chip-neutral-text)",
    border: "1px solid var(--pf-chip-neutral-border)",
  },
};

type StatusPillProps = {
  variant?: StatusPillVariant;
  children: ReactNode;
  /** Uppercase event pills use tighter caps; default false. */
  caps?: boolean;
  style?: CSSProperties;
};

/** Unified pill for reasons, events, and small status labels. */
export function StatusPill({ variant = "default", children, caps = false, style }: StatusPillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--pf-radius-pill)",
        padding: caps ? "5px 10px" : "4px 12px",
        fontSize: caps ? 10 : 12,
        fontWeight: 600,
        letterSpacing: caps ? "0.16em" : "0.04em",
        textTransform: caps ? "uppercase" : "none",
        lineHeight: 1.2,
        ...variantStyle[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
