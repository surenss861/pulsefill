import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type OperatorEmptyStateProps = {
  title: string;
  description: ReactNode;
  /** Optional mark, icon, or small illustration above the title. */
  visual?: ReactNode;
  primaryAction?: ReactNode;
  secondaryContent?: ReactNode;
  style?: CSSProperties;
};

/** Next-action empty state — not a blank “no data” box. */
export function OperatorEmptyState({
  title,
  description,
  visual,
  primaryAction,
  secondaryContent,
  style,
}: OperatorEmptyStateProps) {
  return (
    <div
      style={{
        padding: "22px 22px 20px",
        ...operatorSurfaceShell("emptyState"),
        ...style,
      }}
    >
      {visual ? (
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>{visual}</div>
      ) : null}
      <p className="pf-section-title" style={{ fontSize: 17, letterSpacing: "-0.02em" }}>
        {title}
      </p>
      <div className="pf-muted-copy" style={{ marginTop: 12, fontSize: 14, maxWidth: 560 }}>
        {description}
      </div>
      {primaryAction ? <div style={{ marginTop: 20 }}>{primaryAction}</div> : null}
      {secondaryContent ? (
        <div
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              borderRadius: "var(--pf-radius-lg)",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.2))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              padding: "14px 16px",
            }}
          >
            {secondaryContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}
