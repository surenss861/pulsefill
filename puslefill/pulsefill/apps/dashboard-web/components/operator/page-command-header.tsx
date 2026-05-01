"use client";

import type { CSSProperties, ReactNode } from "react";
import { FadeUp } from "@/components/motion/operator-motion";
import { operatorPageHeaderDefaultShell, operatorSurfaceShell } from "@/lib/operator-surface-styles";

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
  const shell = tone === "strong" ? operatorSurfaceShell("command") : operatorPageHeaderDefaultShell();
  const padding =
    tone === "strong" ? "clamp(12px, 2vw, 16px) clamp(14px, 2.2vw, 20px)" : "4px 0 18px";

  const inner = (
    <section
      style={{
        marginBottom: 0,
        padding,
        ...shell,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <p className="pf-kicker">{eyebrow}</p>
          <div className="pf-page-title" style={{ marginTop: 6 }}>
            {title}
          </div>
          {description ? (
            <div className="pf-muted-copy" style={{ marginTop: 8, maxWidth: 560 }}>
              {description}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
          {meta ? (
            <div
              style={{
                display: "inline-flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                padding: tone === "strong" ? "5px 10px" : 0,
                borderRadius: tone === "strong" ? 12 : 0,
                background: tone === "strong" ? "rgba(0,0,0,0.28)" : "transparent",
                border: tone === "strong" ? "1px solid rgba(255,255,255,0.07)" : "none",
                boxShadow: tone === "strong" ? "inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
              }}
            >
              {meta}
            </div>
          ) : null}
          {secondaryAction}
          {primaryAction}
        </div>
      </div>
    </section>
  );

  if (!animate) return inner;
  return <FadeUp>{inner}</FadeUp>;
}
