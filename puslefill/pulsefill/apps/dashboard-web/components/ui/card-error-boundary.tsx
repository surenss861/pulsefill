"use client";

import { Component, type ReactNode } from "react";

type Props = {
  /** Shown in the fallback so an operator knows which section failed. */
  label: string;
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * React only isolates render-time exceptions with a class-component error
 * boundary — there is no hook equivalent. Wrap individual Today/Overview
 * cards in this so one card's bad data shape can't blank the whole page;
 * API-level loading/error states are handled separately by each card's own
 * hook and don't need this (this catches unexpected render exceptions).
 */
export class CardErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`[CardErrorBoundary] ${this.props.label} failed to render`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            borderRadius: 12,
            border: "1px solid rgba(248,113,113,0.25)",
            background: "rgba(248,113,113,0.06)",
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(245,247,250,0.78)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: "#f87171" }}>{this.props.label} couldn&apos;t load</p>
          <p style={{ margin: "4px 0 0" }}>The rest of Today is still available — try reloading the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
