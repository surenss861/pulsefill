"use client";

type Props = {
  counts: Record<string, number>;
};

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        minWidth: 120,
        padding: "12px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
    </div>
  );
}

export function OperatorSlotListSummary({ counts }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      <SummaryChip label="Open" value={counts.open ?? 0} />
      <SummaryChip label="Offered" value={counts.offered ?? 0} />
      <SummaryChip label="Claimed" value={counts.claimed ?? 0} />
      <SummaryChip label="Booked" value={counts.booked ?? 0} />
      <SummaryChip label="Expired" value={counts.expired ?? 0} />
    </div>
  );
}
