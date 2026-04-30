import type { CSSProperties } from "react";

export type OperatorActionLinkVariant = "primary" | "secondary" | "ghost";

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 650,
  fontSize: 14,
  borderRadius: "var(--pf-radius-sm)",
  cursor: "pointer",
  transition: "filter var(--pf-transition-fast), opacity var(--pf-transition-fast), border-color var(--pf-transition-fast)",
  textDecoration: "none",
  borderStyle: "solid",
  borderWidth: 1,
};

const variants: Record<OperatorActionLinkVariant, CSSProperties> = {
  primary: {
    ...base,
    borderColor: "transparent",
    background: "var(--pf-btn-primary-bg)",
    color: "var(--pf-btn-primary-text)",
    boxShadow: "var(--pf-btn-primary-shadow)",
    padding: "12px 20px",
  },
  secondary: {
    ...base,
    borderColor: "var(--pf-btn-secondary-border)",
    background: "var(--pf-btn-secondary-bg)",
    color: "var(--pf-btn-secondary-text)",
    padding: "10px 16px",
  },
  ghost: {
    ...base,
    borderColor: "transparent",
    background: "transparent",
    color: "rgba(245, 247, 250, 0.72)",
    padding: "8px 12px",
  },
};

/** Link styles shared by server auth pages and client components (no `"use client"`). */
export function actionLinkStyle(variant: OperatorActionLinkVariant = "primary"): CSSProperties {
  if (variant === "primary") {
    return {
      ...variants.primary,
      border: "none",
      display: "inline-flex",
    };
  }
  if (variant === "secondary") {
    return { ...variants.secondary, display: "inline-flex", textDecoration: "none" };
  }
  return { ...variants.ghost, color: "var(--pf-btn-link-text)", display: "inline-flex", textDecoration: "none" };
}
