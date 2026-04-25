export type OutcomesMetrics = {
  recovered_bookings_today: number;
  recovered_revenue_cents_today: number;
  awaiting_confirmation_count: number;
  no_matches_today: number;
  delivery_failures_today: number;
};

export type OutcomesScorecards = {
  recoveredBookings: number;
  recoveredRevenue: string;
  recoveryRate: string;
  expiredUnfilled: number;
  deliveryFailures: number;
};

export type OutcomeMixRow = {
  label: string;
  value: number;
  emphasis: "primary" | "danger" | "default";
};

export type LeakRow = {
  title: string;
  value: number;
  body: string;
  href: string;
  cta: string;
  emphasis: "primary" | "danger" | "default";
};

export type PerformanceSourceRow = {
  label: string;
  recovered_bookings: number;
  no_matches: number;
  delivery_failures: number;
};

export type PerformanceRow = {
  label: string;
  recovered: number;
  lost: number;
  rate: string;
};

export function formatUsdFromCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  }).format(dollars);
}

export function pctRate(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0%";
  return `${Math.min(100, Math.round((numerator / denominator) * 100))}%`;
}

export function formatOutcomesWindowLabel(dateIso: string): string {
  return `Today - ${new Date(`${dateIso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function buildOutcomesScorecards(input: {
  metrics: OutcomesMetrics;
  expiredUnfilled: number;
  openSlotsCreated30d: number;
  slotsBooked30d: number;
}): OutcomesScorecards {
  const { metrics, expiredUnfilled, openSlotsCreated30d, slotsBooked30d } = input;
  const recoveryRate = pctRate(slotsBooked30d, Math.max(1, openSlotsCreated30d));

  return {
    recoveredBookings: metrics.recovered_bookings_today,
    recoveredRevenue: formatUsdFromCents(metrics.recovered_revenue_cents_today),
    recoveryRate,
    expiredUnfilled,
    deliveryFailures: metrics.delivery_failures_today,
  };
}

export function buildOutcomesMix(metrics: OutcomesMetrics, expiredUnfilled: number): OutcomeMixRow[] {
  return [
    { label: "Recovered", value: metrics.recovered_bookings_today, emphasis: "primary" },
    { label: "Awaiting confirmation", value: metrics.awaiting_confirmation_count, emphasis: "default" },
    { label: "Expired unfilled", value: expiredUnfilled, emphasis: expiredUnfilled > 0 ? "danger" : "default" },
    { label: "No matches", value: metrics.no_matches_today, emphasis: "default" },
    {
      label: "Delivery failures",
      value: metrics.delivery_failures_today,
      emphasis: metrics.delivery_failures_today > 0 ? "danger" : "default",
    },
  ];
}

export function buildOutcomesLeaks(metrics: OutcomesMetrics): LeakRow[] {
  const leakCandidates: LeakRow[] = [
    {
      title: "Delivery failures",
      value: metrics.delivery_failures_today,
      body: "Notification failures or suppression reduced recovery reach. These are the clearest operational misses.",
      href: "/action-queue?section=needs_action",
      cta: "Review queue",
      emphasis: "danger",
    },
    {
      title: "No matches",
      value: metrics.no_matches_today,
      body: "Openings are not finding standby demand. Coverage may be too thin or preferences too narrow.",
      href: "/open-slots?attention=no_matches",
      cta: "Inspect slots",
      emphasis: "default",
    },
    {
      title: "Unconfirmed claims",
      value: metrics.awaiting_confirmation_count,
      body: "Claims exist, but operator confirmation has not closed the recovery loop yet.",
      href: "/action-queue?section=needs_action",
      cta: "Confirm bookings",
      emphasis: "primary",
    },
  ];

  return [...leakCandidates].sort((a, b) => b.value - a.value).slice(0, 3);
}

export function buildOutcomesPerformanceRows(rows: PerformanceSourceRow[]): PerformanceRow[] {
  return rows
    .map((row) => {
      const lost = row.no_matches + row.delivery_failures;
      const recovered = row.recovered_bookings;
      const denominator = recovered + lost;
      return {
        label: row.label || "Location",
        recovered,
        lost,
        rate: pctRate(recovered, Math.max(1, denominator)),
      };
    })
    .filter((row) => row.recovered > 0 || row.lost > 0)
    .sort((a, b) => b.recovered + b.lost - (a.recovered + a.lost))
    .slice(0, 8);
}
