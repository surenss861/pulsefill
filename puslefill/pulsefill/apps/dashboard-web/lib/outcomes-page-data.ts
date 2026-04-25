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

export type OutcomesLeakRow = {
  title: string;
  value: number;
  body: string;
  href: string;
  cta: string;
  emphasis: "primary" | "danger" | "default";
};

export type OutcomesPerformanceRow = {
  label: string;
  recovered: number;
  lost: number;
  rate: string;
};

export type OutcomesRecentItem = {
  id: string;
  title: string;
  detail: string;
  outcome: string;
  href: string;
};

export type OutcomesPageData = {
  /** Hero reporting window, e.g. business-local “Today · Apr 16, 2026”. */
  windowLabel?: string;
  scorecards: OutcomesScorecards;
  outcomeMix: OutcomeMixRow[];
  leaks: OutcomesLeakRow[];
  performanceRows: OutcomesPerformanceRow[];
  recentRecovered: OutcomesRecentItem[];
  recentLost: OutcomesRecentItem[];
};
