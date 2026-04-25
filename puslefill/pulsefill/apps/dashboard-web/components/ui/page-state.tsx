import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export type PageStateVariant = "empty" | "error" | "success" | "info";

const shells: Record<PageStateVariant, CSSProperties> = {
  empty: {
    border: "1px solid var(--pf-border-subtle)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(245, 247, 250, 0.58)",
  },
  error: {
    border: "1px solid var(--pf-danger-border)",
    background: "var(--pf-danger-soft)",
    color: "#fecaca",
  },
  success: {
    border: "1px solid var(--pf-accent-primary-border)",
    background: "rgba(255, 122, 26, 0.08)",
    color: "rgba(254, 243, 199, 0.95)",
  },
  info: {
    border: "1px solid var(--pf-border-default)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(245, 247, 250, 0.72)",
  },
};

type PageStateProps = {
  variant: PageStateVariant;
  title: string;
  description?: ReactNode;
  /** Optional primary CTA (same language as app primary actions). */
  ctaLabel?: string;
  ctaHref?: string;
  style?: CSSProperties;
};

/** Unified empty / error / success / info blocks across operator surfaces and auth. */
export function PageState({ variant, title, description, ctaLabel, ctaHref, style }: PageStateProps) {
  const isProminentTitle = variant === "empty";

  return (
    <div
      style={{
        borderRadius: "var(--pf-radius-md)",
        padding: "var(--pf-space-4)",
        maxWidth: 560,
        ...shells[variant],
        ...style,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: isProminentTitle ? 18 : 11,
          fontWeight: isProminentTitle ? 650 : 600,
          letterSpacing: isProminentTitle ? "-0.02em" : "0.2em",
          textTransform: isProminentTitle ? "none" : "uppercase",
          color: isProminentTitle ? "var(--pf-text-primary)" : "rgba(245, 247, 250, 0.45)",
        }}
      >
        {title}
      </p>
      {description ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.55,
            color: variant === "empty" ? "var(--pf-text-secondary)" : "inherit",
          }}
        >
          {description}
        </div>
      ) : null}
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          style={{
            display: "inline-flex",
            marginTop: 16,
            padding: "10px 16px",
            borderRadius: "var(--pf-radius-sm)",
            background: "var(--pf-btn-primary-bg)",
            color: "var(--pf-btn-primary-text)",
            fontSize: 13,
            fontWeight: 650,
            textDecoration: "none",
            boxShadow: "var(--pf-btn-primary-shadow)",
          }}
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
