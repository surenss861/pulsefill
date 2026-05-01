"use client";

import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";

type OperatorRowListProps = {
  children: ReactNode;
  emptyState?: ReactNode;
  density?: "comfortable" | "compact";
  style?: CSSProperties;
};

type OperatorRowProps = {
  title: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
  leading?: ReactNode;
  emphasis?: "normal" | "attention" | "quiet";
  onClick?: () => void;
  style?: CSSProperties;
};

export function OperatorRowList({ children, emptyState, density = "comfortable", style }: OperatorRowListProps) {
  const flat = Children.toArray(children).filter((c) => c != null);
  const hasRows = flat.some((c) => isValidElement(c));
  if (!hasRows && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={`pf-operator-row-list pf-operator-row-list--${density}`}
      style={{ marginTop: 4, ...style }}
    >
      {children}
    </div>
  );
}

export function OperatorRow({
  title,
  meta,
  status,
  action,
  leading,
  emphasis = "normal",
  onClick,
  style,
}: OperatorRowProps) {
  const interactive = typeof onClick === "function";
  return (
    <div
      className={`pf-operator-row pf-operator-row--${emphasis}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={style}
    >
      {leading ? <div className="pf-operator-row__leading">{leading}</div> : null}
      <div className="pf-operator-row__main">
        <div className="pf-operator-row__title">{title}</div>
        {meta ? <div className="pf-operator-row__meta">{meta}</div> : null}
      </div>
      {status ? <div className="pf-operator-row__status">{status}</div> : null}
      {action ? <div className="pf-operator-row__action">{action}</div> : null}
    </div>
  );
}
