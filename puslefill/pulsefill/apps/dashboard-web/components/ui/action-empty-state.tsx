"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

export function ActionEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.description}>{description}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} style={styles.button}>
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 24,
    color: "var(--text)",
    maxWidth: 520,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 650,
    letterSpacing: "-0.02em",
  },
  description: {
    margin: "10px 0 0 0",
    maxWidth: 520,
    fontSize: 14,
    lineHeight: 1.55,
    color: "var(--muted)",
  },
  button: {
    display: "inline-block",
    marginTop: 18,
    padding: "10px 14px",
    borderRadius: 14,
    textDecoration: "none",
    color: "#0a0c10",
    background: "var(--primary)",
    fontSize: 13,
    fontWeight: 600,
  },
};
