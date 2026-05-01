"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { operatorApiErrorUi } from "@/lib/operator-api-error-ui";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

type OperatorErrorStateProps = {
  title?: string;
  description?: string;
  /** When set, title/description are derived (session/network/data) — avoids raw “unauthorized” in UI. */
  rawMessage?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  compact?: boolean;
  style?: CSSProperties;
};

export function OperatorErrorState({
  title,
  description,
  rawMessage,
  primaryAction,
  secondaryAction,
  compact = false,
  style,
}: OperatorErrorStateProps) {
  const fromRaw = rawMessage != null && rawMessage.trim().length > 0 ? operatorApiErrorUi(rawMessage.trim()) : null;
  const resolvedTitle = title ?? fromRaw?.title ?? "We couldn’t load this area";
  const resolvedDescription =
    description ??
    fromRaw?.description ??
    "Try again in a moment. If this keeps happening, refresh the page.";

  const showSignIn = Boolean(fromRaw?.showSignIn);

  const signIn = showSignIn ? (
    <Link href="/sign-in" style={actionLinkStyle("primary")}>
      Sign in
    </Link>
  ) : null;

  const retry =
    primaryAction ??
    (!showSignIn ? (
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          ...actionLinkStyle("secondary"),
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          padding: "8px 14px",
          borderRadius: 10,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Retry
      </button>
    ) : null);

  const pad = compact ? "14px 16px" : "18px 18px";

  return (
    <div
      role="alert"
      style={{
        padding: pad,
        ...operatorSurfaceShell("quiet"),
        borderRadius: "var(--pf-radius-lg)",
        borderColor: "rgba(201, 59, 47, 0.22)",
        ...style,
      }}
    >
      <p className="pf-section-title" style={{ fontSize: compact ? 14 : 15, margin: 0, color: "rgba(254, 202, 202, 0.95)" }}>
        {resolvedTitle}
      </p>
      <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(245,247,250,0.68)" }}>
        {resolvedDescription}
      </p>
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        {signIn}
        {retry}
        {secondaryAction}
      </div>
    </div>
  );
}
