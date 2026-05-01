import { OperatorMetricStrip } from "@/components/operator/operator-metric-strip";
import type { OperatorActivitySummary } from "@/lib/operator-activity-summary";

type ActivitySummaryStripProps = {
  summary: OperatorActivitySummary;
};

export function ActivitySummaryStrip({ summary }: ActivitySummaryStripProps) {
  const cards = [
    {
      label: "Recovered",
      value: summary.recovered,
      emphasis: "primary" as const,
      hint: "Bookings confirmed from offers",
    },
    {
      label: "Delivery issues",
      value: summary.deliveryFailures,
      emphasis: "danger" as const,
      hint: "Push or email failures",
    },
    { label: "Note updates", value: summary.noteUpdates, emphasis: "default" as const, hint: "Staff notes on offers" },
    {
      label: "Waiting",
      value: summary.pendingConfirmations,
      emphasis: "primary" as const,
      hint: "Claims needing confirmation",
    },
    { label: "Expired", value: summary.expired, emphasis: "danger" as const, hint: "Offers that timed out" },
  ];

  const allZero = cards.every((c) => c.value === 0);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <OperatorMetricStrip items={cards} compact={allZero} />
    </section>
  );
}
