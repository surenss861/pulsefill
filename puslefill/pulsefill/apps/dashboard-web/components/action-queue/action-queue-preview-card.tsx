"use client";

import Link from "next/link";
import { ActionQueueItemCard } from "@/components/action-queue/action-queue-item-card";
import type { ActionQueueItem } from "@/types/action-queue";

export function ActionQueuePreviewCard({
  items,
  loading,
  error,
}: {
  items: ActionQueueItem[];
  loading: boolean;
  error: string | null;
}) {
  const top = items.slice(0, 5);

  return (
    <div
      style={{
        marginTop: 24,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.02)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Needs attention now</h2>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14, maxWidth: 520 }}>
            The highest-priority recovery items currently waiting on operator action.
          </p>
        </div>
        <Link
          href="/action-queue"
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            color: "var(--text)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Open Action Queue
        </Link>
      </div>

      {error ? <p style={{ color: "#f87171", marginTop: 12 }}>{error}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading…</p> : null}

      {!loading && !error && top.length === 0 ? (
        <p style={{ color: "var(--muted)", marginTop: 16, marginBottom: 0 }}>
          No urgent recovery work right now. Review open slots or check delivery health below.
        </p>
      ) : null}

      {!loading && top.length > 0 ? (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {top.map((item) => (
            <ActionQueueItemCard key={item.id} item={item} section="needs_action" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
