"use client";

import type { ReactNode } from "react";

export function ActionQueueSection({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
        {subtitle ? (
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14 }}>{subtitle}</p>
        ) : null}
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{count} item{count === 1 ? "" : "s"}</div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </section>
  );
}
