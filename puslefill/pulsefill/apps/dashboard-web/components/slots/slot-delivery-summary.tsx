"use client";

type DeliverySummary = {
  sent: number;
  failed: number;
  skipped: number;
  simulated: number;
};

type Props = {
  summary: DeliverySummary | null;
  loading?: boolean;
};

export function SlotDeliverySummary({ summary, loading }: Props) {
  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          fontSize: 13,
          opacity: 0.75,
        }}
      >
        Loading delivery summary…
      </div>
    );
  }

  const s = summary ?? { sent: 0, failed: 0, skipped: 0, simulated: 0 };

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
        {s.sent} sent · {s.skipped} skipped · {s.failed} failed · {s.simulated} simulated
      </div>
    </div>
  );
}
