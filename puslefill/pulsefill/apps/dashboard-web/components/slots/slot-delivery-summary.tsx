"use client";

import type { NotificationLogRow } from "@/types/notification-log";

type Props = {
  logs: NotificationLogRow[];
};

export function SlotDeliverySummary({ logs }: Props) {
  const delivered = logs.filter((x) => x.status === "delivered").length;
  const failed = logs.filter((x) => x.status === "failed").length;
  const simulated = logs.filter((x) => x.status === "simulated").length;
  const latestFailure = logs.find((x) => x.status === "failed");

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 700 }}>DELIVERY SUMMARY</div>

      <div style={{ fontSize: 14 }}>
        {delivered} delivered · {failed} failed · {simulated} simulated
      </div>

      {latestFailure?.error ? (
        <div style={{ fontSize: 13, opacity: 0.8 }}>Latest issue: {latestFailure.error}</div>
      ) : null}
    </div>
  );
}
