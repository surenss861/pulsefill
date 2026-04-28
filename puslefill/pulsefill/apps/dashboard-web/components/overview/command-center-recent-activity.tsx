"use client";

import Link from "next/link";
import { useOperatorActivityFeed } from "@/hooks/useOperatorActivityFeed";

export function CommandCenterRecentActivity() {
  const { items, loading, error } = useOperatorActivityFeed(120_000);
  const top = items.slice(0, 3);

  return (
    <section
      style={{
        marginTop: 24,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650, letterSpacing: "-0.02em" }}>Recent activity</h2>
        <Link
          href="/activity"
          style={{ fontSize: 13, fontWeight: 600, color: "var(--pf-accent-primary)", textDecoration: "none" }}
        >
          View all
        </Link>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", maxWidth: 520 }}>
        Latest events from openings, offers, claims, and notifications.
      </p>

      {error ? <p style={{ color: "#f87171", marginTop: 12, marginBottom: 0 }}>{error}</p> : null}
      {loading && !error ? <p style={{ color: "var(--muted)", marginTop: 14, marginBottom: 0 }}>Loading…</p> : null}

      {!loading && !error && top.length === 0 ? (
        <p style={{ color: "var(--muted)", marginTop: 14, marginBottom: 0 }}>No events yet.</p>
      ) : null}

      {!loading && !error && top.length > 0 ? (
        <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {top.map((item) => (
            <li
              key={item.id}
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.2)",
                padding: "12px 14px",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.title}</p>
              {item.detail ? (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>{item.detail}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
