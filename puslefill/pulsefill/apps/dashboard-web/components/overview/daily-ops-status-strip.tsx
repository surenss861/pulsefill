"use client";

type Props = {
  byStatus?: Record<string, number>;
};

export function DailyOpsStatusStrip({ byStatus }: Props) {
  if (!byStatus) return null;

  const items = [
    ["Open", byStatus.open ?? 0],
    ["Offered", byStatus.offered ?? 0],
    ["Claimed", byStatus.claimed ?? 0],
    ["Booked", byStatus.booked ?? 0],
    ["Expired", byStatus.expired ?? 0],
  ];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {items.map(([label, value]) => (
        <div
          key={label}
          style={{
            padding: "8px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            opacity: 0.82,
          }}
        >
          {label}: {value}
        </div>
      ))}
    </div>
  );
}
