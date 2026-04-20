"use client";

type Props = {
  label: string;
  value: string;
  subtle?: boolean;
};

export function DailyOpsSummaryCard({ label, value, subtle }: Props) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: subtle ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{label}</div>
    </div>
  );
}
