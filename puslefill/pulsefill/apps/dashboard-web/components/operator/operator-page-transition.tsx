"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Layout wrapper for protected desk pages. Route-level motion now lives in
 * `WorkspaceRouteMorph` (app shell) so transitions stay consistent and are not doubled.
 */
export function OperatorPageTransition({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
