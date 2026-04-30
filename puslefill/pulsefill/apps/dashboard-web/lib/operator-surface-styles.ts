import type { CSSProperties } from "react";

/** Shared operator UI shells — hierarchy without one generic card style everywhere. */
export type OperatorSurfaceVariant = "hero" | "command" | "operational" | "quiet" | "metric" | "emptyState";

export function operatorSurfaceShell(variant: OperatorSurfaceVariant): CSSProperties {
  const xl = "var(--pf-radius-xl)";
  const lg = "var(--pf-radius-lg)";

  switch (variant) {
    case "hero":
    case "command":
      return {
        borderRadius: xl,
        border: "1px solid var(--pf-accent-primary-border)",
        background: "var(--pf-card-hero-bg)",
        boxShadow:
          "0 28px 76px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255, 122, 24, 0.06)",
      };
    case "operational":
      return {
        borderRadius: xl,
        border: "1px solid var(--pf-border-default)",
        background: "linear-gradient(165deg, rgba(23, 20, 18, 0.98), rgba(14, 13, 11, 0.97))",
        boxShadow: "0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.045)",
      };
    case "quiet":
      return {
        borderRadius: lg,
        border: "1px solid var(--pf-border-subtle)",
        background: "rgba(255,255,255,0.025)",
        boxShadow: "none",
      };
    case "metric":
      return {
        borderRadius: "var(--pf-radius-md)",
        border: "1px solid var(--pf-border-subtle)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.042), rgba(255,122,24,0.02)), var(--pf-bg-surface-muted)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.035)",
      };
    case "emptyState":
      return {
        borderRadius: xl,
        border: "1px dashed rgba(255,255,255,0.14)",
        background:
          "radial-gradient(ellipse 85% 55% at 50% 0%, rgba(255,122,24,0.07), transparent 52%), rgba(255,255,255,0.02)",
        boxShadow: "none",
      };
  }
}
