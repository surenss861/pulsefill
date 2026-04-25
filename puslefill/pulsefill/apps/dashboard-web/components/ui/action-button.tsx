"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export type ActionButtonVariant = "primary" | "secondary" | "danger" | "ghost";

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

const variants: Record<ActionButtonVariant, CSSProperties> = {
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
  danger: {
    ...base,
    borderColor: "var(--pf-danger-border)",
    background: "var(--pf-danger-soft)",
    color: "#fecaca",
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

type ActionButtonProps = {
  variant?: ActionButtonVariant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function ActionButton({ variant = "primary", children, style, disabled, ...rest }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        ...variants[variant],
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Link styled as a primary/secondary action (e.g. hero CTAs). */
export function actionLinkStyle(variant: ActionButtonVariant = "primary"): CSSProperties {
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
