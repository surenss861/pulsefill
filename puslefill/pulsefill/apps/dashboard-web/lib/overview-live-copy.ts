import type { ActionQueueSummary } from "@/types/action-queue";
import type { DailyOpsSummaryResponse } from "@/types/daily-ops-summary";

export function formatOverviewMoneyCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

/** One tight sentence for the hero strip — front desk, not reporting jargon. */
export function buildTodayRecoverySubtitle(
  daily: DailyOpsSummaryResponse,
  queueSummary?: ActionQueueSummary | null,
): string {
  const m = daily.metrics;
  const money = formatOverviewMoneyCents(m.recovered_revenue_cents_today);
  const head = `${m.recovered_bookings_today} visits rebooked today (${money})`;
  const need = queueSummary?.needs_action_count;
  const follow = queueSummary?.customer_follow_up_due_count ?? 0;
  if (typeof need === "number") {
    const total = need + follow;
    const tail =
      total > 0
        ? `${total} item${total === 1 ? "" : "s"} in the queue still need a reply${follow > 0 ? ` (${follow} customer follow-up${follow === 1 ? "" : "s"})` : ""}`
        : "nothing urgent sitting in the queue";
    const ac = m.awaiting_confirmation_count;
    const acBit =
      ac > 0 ? ` · ${ac} slot${ac === 1 ? "" : "s"} still waiting on your confirmation` : "";
    return `${head} · ${tail}${acBit}.`;
  }
  const acOnly = m.awaiting_confirmation_count;
  if (acOnly > 0) {
    return `${head} · ${acOnly} still waiting on your confirmation.`;
  }
  return `${head}.`;
}
