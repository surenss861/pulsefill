"use client";

import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

export type OperatorLoadingSkeleton = "none" | "rows" | "cards" | "form";

type OperatorLoadingStateProps = {
  title?: string;
  description?: string;
  variant?: "page" | "section" | "inline";
  skeleton?: OperatorLoadingSkeleton;
  style?: CSSProperties;
};

const emberMark: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(255, 122, 24, 0.28)",
  background:
    "radial-gradient(circle at 32% 28%, rgba(255, 200, 150, 0.35), rgba(255, 122, 24, 0.1) 45%, rgba(8, 7, 6, 0.85))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.35)",
  flexShrink: 0,
};

function SkeletonRows({ count }: { count: number }) {
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="pf-operator-skel-row"
          style={{
            height: 12,
            borderRadius: 6,
            background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
            backgroundSize: "200% 100%",
            animation: "pf-operator-skel-shimmer 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Branded loading for operator pages — replaces plain “Loading…” text. */
export function OperatorLoadingState({
  title = "Loading recovery workspace…",
  description = "PulseFill is fetching the latest operator state.",
  variant = "page",
  skeleton = "rows",
  style,
}: OperatorLoadingStateProps) {
  const pad = variant === "inline" ? "12px 0" : variant === "section" ? "16px 0" : "20px 0";
  const shell =
    variant === "inline"
      ? { padding: pad, background: "transparent", border: "none", boxShadow: "none" }
      : {
          padding: variant === "section" ? "18px 16px" : "22px 18px",
          ...operatorSurfaceShell("quiet"),
          borderRadius: "var(--pf-radius-lg)",
        };

  return (
    <div style={{ ...shell, ...style }} role="status" aria-live="polite">
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={emberMark} />
        <div style={{ minWidth: 0 }}>
          <p className="pf-section-title" style={{ fontSize: 15, margin: 0 }}>
            {title}
          </p>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {description}
          </p>
        </div>
      </div>
      {skeleton === "rows" ? <SkeletonRows count={variant === "inline" ? 2 : 4} /> : null}
      {skeleton === "cards" ? <SkeletonRows count={3} /> : null}
      {skeleton === "form" ? <SkeletonRows count={5} /> : null}
    </div>
  );
}
