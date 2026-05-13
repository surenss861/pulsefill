"use client";

type Props = {
  counts: Record<string, number>;
  /** Desk pages: human labels, calmer copy. */
  tone?: "default" | "desk";
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

const DESK_LABELS: Record<string, string> = {
  open: "Waiting for offers",
  offered: "Offers sent",
  claimed: "Awaiting confirmation",
  booked: "Confirmed",
  expired: "Expired",
};

export function OperatorSlotListSummary({ counts, tone = "default" }: Props) {
  const lab = (key: string, fallback: string) => (tone === "desk" ? (DESK_LABELS[key] ?? fallback) : fallback);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      <SummaryChip label={lab("open", "Open")} value={counts.open ?? 0} />
      <SummaryChip label={lab("offered", "Offered")} value={counts.offered ?? 0} />
      <SummaryChip label={lab("claimed", "Claimed")} value={counts.claimed ?? 0} />
      <SummaryChip label={lab("booked", "Booked")} value={counts.booked ?? 0} />
      <SummaryChip label={lab("expired", "Expired")} value={counts.expired ?? 0} />
    </div>
  );
}
