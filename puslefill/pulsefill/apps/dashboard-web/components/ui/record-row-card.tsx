"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

type RecordRowCardProps = {
  /** Checkbox or avatar column. */
  leading?: ReactNode;
  /** Pills / timestamp / actor row. */
  topMeta?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  body?: ReactNode;
  /** Trailing actions (e.g. Open detail). */
  actions?: ReactNode;
  /** Full-width row below the main grid (queue/slot action bars). */
  footer?: ReactNode;
  /** When true, border/background stay static (parent supplies chrome). */
  disableHover?: boolean;
  style?: CSSProperties;
};

/**
 * Shared list row shell: queue rows, slot rows, activity rows, outcomes recent rows.
 * Hover treatment matches operator surfaces unless `disableHover`.
 */
export function RecordRowCard({
  leading,
  topMeta,
  title,
  detail,
  body,
  actions,
  footer,
  disableHover = false,
  style,
}: RecordRowCardProps) {
  const [hover, setHover] = useState(false);
  const activeHover = !disableHover && hover;

  const cols = leading ? (actions ? "auto minmax(0,1fr) auto" : "auto minmax(0,1fr)") : actions ? "minmax(0,1fr) auto" : "minmax(0,1fr)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: footer ? 12 : 0,
        border: "1px solid",
        borderColor: activeHover ? "rgba(255,255,255,0.14)" : "var(--pf-border-subtle)",
        borderRadius: "var(--pf-radius-md)",
        padding: "14px 16px",
        background: activeHover ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
        transition: "border-color var(--pf-transition-fast), background var(--pf-transition-fast)",
        ...style,
      }}
      onMouseEnter={() => {
        if (!disableHover) setHover(true);
      }}
      onMouseLeave={() => {
        if (!disableHover) setHover(false);
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          alignItems: "start",
          gridTemplateColumns: cols,
        }}
      >
        {leading ?? null}
        <div style={{ minWidth: 0 }}>
          {topMeta ? <div style={{ marginBottom: 4 }}>{topMeta}</div> : null}
          <div style={{ fontSize: 16, fontWeight: 650, lineHeight: 1.35, color: "rgba(245, 247, 250, 0.92)" }}>{title}</div>
          {detail ? (
            <div style={{ fontSize: 13, color: "rgba(245, 247, 250, 0.46)", marginTop: 6, lineHeight: 1.4 }}>{detail}</div>
          ) : null}
          {body ? (
            <div style={{ fontSize: 13, color: "rgba(245, 247, 250, 0.58)", marginTop: 10, lineHeight: 1.5, maxWidth: "64ch" }}>
              {body}
            </div>
          ) : null}
        </div>
        {actions ?? null}
      </div>
      {footer ? <div style={{ width: "100%" }}>{footer}</div> : null}
    </div>
  );
}
