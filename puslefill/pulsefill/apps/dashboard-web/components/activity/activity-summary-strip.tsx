import { MetricCard } from "@/components/ui/metric-card";
import type { OperatorActivitySummary } from "@/lib/operator-activity-summary";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

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

  const allZero = cards.every((c) => c.value === 0);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {allZero ? (
        <div
          style={{
            ...operatorSurfaceShell("emptyState"),
            padding: "16px 18px",
          }}
        >
          <p style={{ margin: 0, fontSize: 15, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--pf-text-primary)" }}>
            No recovery activity yet
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>
            Create an opening, send offers, or confirm a booking to start building history.
          </p>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: allZero ? 8 : 10,
          opacity: allZero ? 0.78 : 1,
        }}
      >
        {cards.map((c) => (
          <MetricCard
            key={c.label}
            label={c.label}
            value={c.value}
            emphasis={c.emphasis}
            size={allZero ? "compact" : "default"}
            style={{ flex: "1 1 110px", minWidth: allZero ? 88 : 100 }}
          />
        ))}
      </div>
    </section>
  );
}
