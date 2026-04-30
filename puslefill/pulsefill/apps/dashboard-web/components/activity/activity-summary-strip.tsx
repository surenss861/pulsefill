import { OperatorMetricStrip } from "@/components/operator/operator-metric-strip";
import type { OperatorActivitySummary } from "@/lib/operator-activity-summary";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

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

      <OperatorMetricStrip items={cards} compact={allZero} />
    </section>
  );
}
