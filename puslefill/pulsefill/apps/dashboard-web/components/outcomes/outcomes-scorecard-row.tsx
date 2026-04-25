import { MetricCard } from "@/components/ui/metric-card";
import type { OutcomesScorecards } from "@/lib/outcomes-page-data";

type OutcomesScorecardRowProps = {
  scorecards: OutcomesScorecards;
};

export function OutcomesScorecardRow({ scorecards }: OutcomesScorecardRowProps) {
  const cards = [
    { label: "Recovered bookings", value: String(scorecards.recoveredBookings), emphasis: "primary" as const },
    { label: "Recovered revenue", value: scorecards.recoveredRevenue, emphasis: "primary" as const },
    { label: "Recovery rate", value: scorecards.recoveryRate, emphasis: "default" as const },
    { label: "Expired unfilled", value: String(scorecards.expiredUnfilled), emphasis: "danger" as const },
    { label: "Delivery failures", value: String(scorecards.deliveryFailures), emphasis: "danger" as const },
  ];

  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {cards.map((card) => (
        <MetricCard key={card.label} label={card.label} value={card.value} emphasis={card.emphasis} style={{ flex: "1 1 140px", minWidth: 140 }} />
      ))}
    </section>
  );
}
