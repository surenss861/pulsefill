import type { CSSProperties } from "react";

/** Shared operator UI shells — hierarchy without one generic card style everywhere. */
export type OperatorSurfaceVariant =
  | "hero"
  | "command"
  | "nextBestAction"
  | "operational"
  | "quiet"
  | "metric"
  | "emptyState";

const warmBorder = "var(--pf-brand-border-warm-mid)";
const warmBorderSoft = "var(--pf-brand-border-warm)";

export function operatorSurfaceShell(variant: OperatorSurfaceVariant): CSSProperties {
  const xl = "var(--pf-radius-xl)";
  const lg = "var(--pf-radius-lg)";

  switch (variant) {
    case "hero":
    case "command":
      return {
        borderRadius: xl,
        border: `1px solid var(--pf-accent-primary-border)`,
        background:
          "radial-gradient(ellipse 90% 80% at 0% 0%, rgba(255, 122, 24, 0.11), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(201, 59, 47, 0.06), transparent 50%), var(--pf-card-hero-bg)",
        boxShadow:
          "0 28px 76px rgba(0,0,0,0.34), inset 0 1px 0 var(--pf-surface-highlight), inset 0 0 0 1px rgba(255, 122, 24, 0.04), 0 0 0 1px rgba(255, 122, 24, 0.05)",
      };
    case "nextBestAction":
      /* Base layer; `NextBestActionCard` merges priority-specific border/shadow/background. */
      return {
        borderRadius: xl,
        border: `1px solid ${warmBorder}`,
        background:
          "linear-gradient(118deg, rgba(33, 27, 20, 0.98) 0%, rgba(16, 13, 10, 0.995) 48%, rgba(20, 16, 13, 0.98) 100%), radial-gradient(ellipse 72% 88% at 0% 18%, rgba(255, 122, 24, 0.09), transparent 58%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(201, 59, 47, 0.05), transparent 52%)",
        boxShadow:
          "0 24px 64px rgba(0,0,0,0.32), inset 0 1px 0 var(--pf-surface-highlight), inset 0 0 0 1px rgba(255, 122, 24, 0.04)",
      };
    case "operational":
      return {
        borderRadius: xl,
        border: `1px solid ${warmBorder}`,
        background:
          "linear-gradient(165deg, rgba(33, 27, 22, 0.99), rgba(14, 12, 10, 0.98)), radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,122,24,0.05), transparent 52%)",
        boxShadow:
          "0 18px 52px rgba(0,0,0,0.28), inset 0 1px 0 var(--pf-surface-highlight), inset 0 -1px 0 rgba(0,0,0,0.22)",
      };
    case "quiet":
      return {
        borderRadius: lg,
        border: `1px solid ${warmBorderSoft}`,
        background: "linear-gradient(180deg, var(--pf-surface-tint-04), rgba(16, 13, 10, 0.55))",
        boxShadow: "inset 0 1px 0 var(--pf-surface-highlight), 0 6px 22px rgba(0,0,0,0.16)",
      };
    case "metric":
      return {
        borderRadius: "var(--pf-radius-md)",
        border: `1px solid ${warmBorder}`,
        background:
          "linear-gradient(180deg, var(--pf-surface-tint-04), rgba(255,122,24,0.02)), linear-gradient(180deg, var(--pf-brand-brown-900), var(--pf-brand-ink-925))",
        boxShadow: "inset 0 1px 0 var(--pf-surface-highlight), 0 5px 20px rgba(0,0,0,0.18)",
      };
    case "emptyState":
      return {
        borderRadius: xl,
        border: `1px solid ${warmBorderSoft}`,
        background:
          "linear-gradient(180deg, var(--pf-surface-tint-04), rgba(14, 12, 10, 0.94)), radial-gradient(ellipse 100% 55% at 50% 0%, rgba(255,122,24,0.05), transparent 50%)",
        boxShadow: "inset 0 1px 0 var(--pf-surface-highlight), 0 10px 36px rgba(0,0,0,0.18)",
      };
  }
}

/** Editorial page header — no card chrome (command surfaces stay in NBA / forms). */
export function operatorPageHeaderDefaultShell(): CSSProperties {
  return {
    borderRadius: 0,
    border: "none",
    background: "transparent",
    boxShadow: "none",
  };
}
