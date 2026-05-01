import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type OperatorFormShellProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  rail?: ReactNode;
  footer?: ReactNode;
  mode?: "single" | "withRail";
  style?: CSSProperties;
};

/** Consistent intake layout: main form + optional guidance rail. */
export function OperatorFormShell({
  title,
  description,
  children,
  rail,
  footer,
  mode = "withRail",
  style,
}: OperatorFormShellProps) {
  const showRail = mode === "withRail" && rail != null;

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: showRail ? "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" : "1fr",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 18,
          ...operatorSurfaceShell("operational"),
        }}
      >
        {title ? (
          <h2 className="pf-section-title" style={{ fontSize: 15, margin: 0 }}>
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="pf-muted-copy" style={{ margin: title ? 0 : undefined, fontSize: 13 }}>
            {description}
          </p>
        ) : null}
        {children}
        {footer ? <div style={{ marginTop: 4 }}>{footer}</div> : null}
      </div>
      {showRail ? (
        <div style={{ padding: 18, ...operatorSurfaceShell("quiet"), alignSelf: "stretch" }}>{rail}</div>
      ) : null}
    </div>
  );
}
