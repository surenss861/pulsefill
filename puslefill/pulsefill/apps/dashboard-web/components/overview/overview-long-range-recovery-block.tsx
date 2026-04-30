"use client";

import type { ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type Props = {
  children: ReactNode;
};

const TITLE = "Longer-range recovery view";
const SUBTITLE =
  "Use broader trends to spot recurring workflow issues and recovery patterns over time.";

export function OverviewLongRangeRecoveryBlock({ children }: Props) {
  return (
    <section
      style={{
        marginTop: 22,
        padding: "18px 20px",
        ...operatorSurfaceShell("quiet"),
      }}
    >
      <h2
        style={{
          margin: "0 0 6px 0",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(245,247,250,0.4)",
        }}
      >
        {TITLE}
      </h2>
      <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "rgba(245,247,250,0.42)", maxWidth: 720, lineHeight: 1.55 }}>
        {SUBTITLE}
      </p>
      {children}
    </section>
  );
}
