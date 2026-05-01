import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

export type OperatorActionPanelPriority = "critical" | "attention" | "normal" | "quiet";

type OperatorActionPanelProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  status?: ReactNode;
  priority?: OperatorActionPanelPriority;
  style?: CSSProperties;
};

const priorityShell: Record<OperatorActionPanelPriority, CSSProperties> = {
  critical: operatorSurfaceShell("operational"),
  attention: operatorSurfaceShell("operational"),
  normal: operatorSurfaceShell("quiet"),
  quiet: {
    borderRadius: "var(--pf-radius-md)",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(0,0,0,0.12)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },
};

/** Decision / primary operator action block (send offers, confirm claim, etc.). */
export function OperatorActionPanel({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  status,
  priority = "normal",
  style,
}: OperatorActionPanelProps) {
  const shell = priorityShell[priority];
  const borderAccent =
    priority === "critical" || priority === "attention"
      ? { borderColor: "rgba(255, 122, 24, 0.28)" }
      : {};

  return (
    <section style={{ padding: 16, ...shell, ...borderAccent, ...style }}>
      {eyebrow ? (
        <p className="pf-kicker" style={{ margin: "0 0 8px" }}>
          {eyebrow}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: "1 1 200px" }}>
          <h2 className="pf-section-title" style={{ fontSize: 16, margin: 0 }}>
            {title}
          </h2>
          {description ? (
            <div className="pf-muted-copy" style={{ marginTop: 8, fontSize: 13 }}>
              {description}
            </div>
          ) : null}
        </div>
        {status ? <div style={{ flexShrink: 0 }}>{status}</div> : null}
      </div>
      {primaryAction || secondaryAction ? (
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}
