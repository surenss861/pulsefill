import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type OperatorEmptyStateProps = {
  title: string;
  description: ReactNode;
  primaryAction?: ReactNode;
  secondaryContent?: ReactNode;
  style?: CSSProperties;
};

/** Next-action empty state — not a blank “no data” box. */
export function OperatorEmptyState({ title, description, primaryAction, secondaryContent, style }: OperatorEmptyStateProps) {
  return (
    <div
      style={{
        padding: 20,
        ...operatorSurfaceShell("emptyState"),
        ...style,
      }}
    >
      <p style={{ margin: 0, fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--pf-text-primary)" }}>{title}</p>
      <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, color: "var(--muted)", maxWidth: 520 }}>{description}</div>
      {primaryAction ? <div style={{ marginTop: 16 }}>{primaryAction}</div> : null}
      {secondaryContent ? <div style={{ marginTop: 18 }}>{secondaryContent}</div> : null}
    </div>
  );
}
