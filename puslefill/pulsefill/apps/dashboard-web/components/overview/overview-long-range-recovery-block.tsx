"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const TITLE = "Longer-range recovery view";
const SUBTITLE =
  "Use broader trends to spot recurring workflow issues and recovery patterns over time.";

export function OverviewLongRangeRecoveryBlock({ children }: Props) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 650, letterSpacing: "-0.02em" }}>{TITLE}</h2>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--muted)", maxWidth: 720, lineHeight: 1.55 }}>
        {SUBTITLE}
      </p>
      {children}
    </section>
  );
}
