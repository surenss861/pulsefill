import { MetricCard } from "@/components/ui/metric-card";
import type { OperatorActivitySummary } from "@/lib/operator-activity-summary";

type ActivitySummaryStripProps = {
  summary: OperatorActivitySummary;
};

export function ActivitySummaryStrip({ summary }: ActivitySummaryStripProps) {
  const cards = [
    { label: "Recovered", value: summary.recovered, emphasis: "primary" as const },
    { label: "Delivery issues", value: summary.deliveryFailures, emphasis: "danger" as const },
    { label: "Note updates", value: summary.noteUpdates, emphasis: "default" as const },
    { label: "Waiting", value: summary.pendingConfirmations, emphasis: "primary" as const },
    { label: "Expired", value: summary.expired, emphasis: "danger" as const },
  ];

  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {cards.map((c) => (
        <MetricCard
          key={c.label}
          label={c.label}
          value={c.value}
          emphasis={c.emphasis}
          style={{ flex: "1 1 110px", minWidth: 100, padding: "12px 14px" }}
        />
      ))}
    </section>
  );
}
