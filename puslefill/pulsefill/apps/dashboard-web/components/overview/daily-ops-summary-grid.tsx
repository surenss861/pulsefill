"use client";

import { DailyOpsSummaryCard } from "@/components/overview/daily-ops-summary-card";
import type { DailyOpsSummaryResponse } from "@/types/daily-ops-summary";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

type Props = {
  data: DailyOpsSummaryResponse;
};

export function DailyOpsSummaryGrid({ data }: Props) {
  const m = data.metrics;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}
    >
      <DailyOpsSummaryCard label="Recovered bookings" value={String(m.recovered_bookings_today)} />
      <DailyOpsSummaryCard label="Recovered revenue" value={formatCurrency(m.recovered_revenue_cents_today)} />
      <DailyOpsSummaryCard label="Awaiting confirmation" value={String(m.awaiting_confirmation_count)} subtle />
      <DailyOpsSummaryCard label="Delivery failures" value={String(m.delivery_failures_today)} subtle />
      <DailyOpsSummaryCard label="No matches" value={String(m.no_matches_today)} subtle />
      <DailyOpsSummaryCard label="Active offered" value={String(m.active_offered_slots_count)} subtle />
    </div>
  );
}
