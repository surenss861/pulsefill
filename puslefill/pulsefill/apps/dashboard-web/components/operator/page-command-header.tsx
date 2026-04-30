"use client";

import type { CSSProperties, ReactNode } from "react";
import { FadeUp } from "@/components/motion/operator-motion";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

export type PageCommandHeaderTone = "default" | "strong";

type PageCommandHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** Status chips, window label, etc. */
  meta?: ReactNode;
  tone?: PageCommandHeaderTone;
  /** Set false when an ancestor already applies motion (e.g. overview). */
  animate?: boolean;
  style?: CSSProperties;
};

const defaultShell: CSSProperties = {
  borderRadius: 24,
  border: "1px solid var(--pf-border-subtle)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,122,24,0.012)), rgba(8,8,7,0.65)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

export function PageCommandHeader({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  meta,
  tone = "default",
  animate = true,
  style,
}: PageCommandHeaderProps) {
  const shell = tone === "strong" ? operatorSurfaceShell("command") : defaultShell;

  const inner = (
    <section
      style={{
        marginBottom: 0,
        padding: "clamp(12px, 2vw, 18px) clamp(14px, 2.2vw, 22px)",
        ...shell,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(245, 247, 250, 0.38)",
            }}
          >
            {eyebrow}
          </p>
          <div
            style={{
              marginTop: 6,
              fontSize: "clamp(1.25rem, 2.8vw, 1.65rem)",
              fontWeight: 650,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: "var(--pf-text-primary)",
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                marginTop: 8,
                maxWidth: 560,
                fontSize: 14,
                lineHeight: 1.5,
                color: "rgba(245, 247, 250, 0.58)",
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
          {meta}
          {secondaryAction}
          {primaryAction}
        </div>
      </div>
    </section>
  );

  if (!animate) return inner;
  return <FadeUp>{inner}</FadeUp>;
}
