"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionQueuePreviewCard } from "@/components/action-queue/action-queue-preview-card";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { DashboardRecoveryPathSection } from "@/components/dashboard/dashboard-recovery-path-section";
import { OverviewMetricCard } from "@/components/ui/overview-metric-card";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { DailyOpsStatusStrip } from "@/components/overview/daily-ops-status-strip";
import { DailyOpsSummaryGrid } from "@/components/overview/daily-ops-summary-grid";
import {
  OverviewDeliveryReliabilityBlock,
  OverviewOpsBreakdownBlock,
} from "@/components/overview/overview-diagnostics-blocks";
import { OverviewLongRangeRecoveryBlock } from "@/components/overview/overview-long-range-recovery-block";
import {
  OverviewOperationalPulse,
  type OverviewPulseLine,
} from "@/components/overview/overview-operational-pulse";
import {
  DEFAULT_OVERVIEW_RECOVERY_SUBTITLE,
  OverviewRecoveryHeroStrip,
} from "@/components/overview/overview-recovery-hero-strip";
import { useActionQueue } from "@/hooks/useActionQueue";
import { useOperatorRefreshSubscription } from "@/hooks/useOperatorRefreshSubscription";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";
import { useDailyOpsSummary } from "@/hooks/useDailyOpsSummary";
import { useDeliveryReliability } from "@/hooks/useDeliveryReliability";
import { useLiveCounts } from "@/hooks/useLiveCounts";
import { useOpsBreakdown } from "@/hooks/useOpsBreakdown";
import { useSetupChecklistState } from "@/hooks/useSetupChecklistState";
import { useSetupOverviewData } from "@/hooks/useSetupOverviewData";
import { OperatorMorningRecoveryDigestPanel } from "@/components/workflow/operator-morning-recovery-digest-panel";
import { CommandCenterRecentActivity } from "@/components/overview/command-center-recent-activity";
import { usePendingStandbyRequests } from "@/hooks/usePendingStandbyRequests";
import { useRecoveryHealth } from "@/hooks/useRecoveryHealth";
import { useBillingSummary } from "@/hooks/useBillingSummary";
import { FadeUp } from "@/components/motion/operator-motion";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import type {
  NextBestActionPriority,
  NextBestSupportingStat,
  NextBestSupportingStatTone,
} from "@/components/operator/next-best-action-card";
import { buildTodayRecoverySubtitle } from "@/lib/overview-live-copy";
import { RecoveryHealthPanel } from "@/components/overview/recovery-health-panel";
import { type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { BillingNoticeBanner } from "@/components/billing/billing-notice-banner";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import type { SetupChecklistState } from "@/hooks/useSetupChecklistState";
function nextSetupHref(state: SetupChecklistState): string {
  if (!state.hasLocation) return "/locations";
  if (!state.hasProvider) return "/providers";
  if (!state.hasService) return "/services";
  if (!state.hasOpenSlot) return "/open-slots/create";
  if (!state.hasOffersSent) return "/customers";
  if (!state.hasConfirmedBooking) return "/claims";
  return "/locations";
}

type OverviewNextBest = {
  actionKey: string;
  priority: NextBestActionPriority;
  title: string;
  description: string;
  pipelineStep?: RecoveryPipelineStepId;
  primaryAction: ReactNode;
  secondaryMeta?: ReactNode;
  supportingStats?: readonly NextBestSupportingStat[];
};

function deskHeroEyebrow(priority: NextBestActionPriority): string | undefined {
  switch (priority) {
    case "setup":
      return undefined;
    case "critical":
      return "Needs a decision";
    case "attention":
      return "Needs review";
    case "ready":
      return "Ready when you are";
    case "clear":
      return "You're caught up";
    default:
      return undefined;
  }
}

function statsInlineColors(tone: NextBestSupportingStatTone | undefined): { label: string; value: string } {
  switch (tone) {
    case "attention":
      return { label: "var(--pf-text-muted)", value: "var(--pf-accent-primary-hover)" };
    case "live":
      return { label: "var(--pf-text-muted)", value: "var(--pf-brand-text)" };
    case "idle":
    default:
      return { label: "var(--pf-brand-text-faint)", value: "var(--pf-text-secondary)" };
  }
}

function formatOverviewUpdatedAt(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "Updated just now";
  if (sec < 90) return "Updated 1 min ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Updated ${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Updated ${hr}h ago`;
  return "Updated earlier";
}

function OverviewDeskHero({ nextBest, refreshedAt }: { nextBest: OverviewNextBest | null; refreshedAt: Date | null }) {
  if (!nextBest) {
    return (
      <DeskHeroCard title="Today" titleId="pf-overview-main-hero-title">
        <p className="pf-muted-copy" style={{ margin: 0 }}>
          Hang on while we load your workspace.
        </p>
      </DeskHeroCard>
    );
  }

  const eyebrow = deskHeroEyebrow(nextBest.priority);

  return (
    <DeskHeroCard title={nextBest.title} titleId="pf-overview-main-hero-title" eyebrow={eyebrow}>
      <p className="pf-desk-hero-card__meta">{nextBest.description}</p>
      {nextBest.secondaryMeta ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13 }}>
          {nextBest.secondaryMeta}
        </p>
      ) : null}
      {refreshedAt ? (
        <p className="pf-meta-row" style={{ margin: 0, fontSize: 12 }}>
          {formatOverviewUpdatedAt(refreshedAt)}
        </p>
      ) : null}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          rowGap: 12,
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "0 1 auto" }}>
          <MotionAction>{nextBest.primaryAction}</MotionAction>
        </div>
        {nextBest.supportingStats && nextBest.supportingStats.length > 0 ? (
          <div
            style={{
              flex: "1 1 200px",
              minWidth: 0,
              fontSize: 12,
              lineHeight: 1.45,
              textAlign: "right",
              color: "var(--pf-text-muted)",
            }}
          >
            {nextBest.supportingStats.map((s, i) => {
              const c = statsInlineColors(s.tone);
              return (
                <span key={`${s.label}-${String(s.value)}`}>
                  {i > 0 ? <span style={{ margin: "0 0.35em", opacity: 0.45 }}>·</span> : null}
                  <span style={{ color: c.label }}>{s.label}: </span>
                  <span style={{ color: c.value, fontWeight: 650 }}>{s.value}</span>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </DeskHeroCard>
  );
}

export type OverviewPageContentProps = {
  displayName: string | null;
  email: string;
  role: string;
  onboardingCompleted: boolean;
};

export function OverviewPageContent({
  displayName: _displayName,
  email: _email,
  role: _role,
  onboardingCompleted: _onboardingCompleted,
}: OverviewPageContentProps) {
  const { metrics, loading: metricsLoading, error: metricsError, reload: reloadMetrics } = useBusinessMetrics();
  const dailyOps = useDailyOpsSummary();
  const opsBreakdown = useOpsBreakdown();
  const deliveryReliability = useDeliveryReliability();
  const actionQueue = useActionQueue(30_000);
  const liveCounts = useLiveCounts(30_000);
  const standbyRequests = usePendingStandbyRequests(60_000);
  const recoveryHealth = useRecoveryHealth();
  const setup = useSetupOverviewData();
  const billingSummary = useBillingSummary();
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const checklist = useSetupChecklistState({
    locationsCount: setup.locationsCount,
    providersCount: setup.providersCount,
    servicesCount: setup.servicesCount,
    openSlotsCount: setup.openSlotsCount,
    offersSent: metrics?.offers_sent ?? 0,
    slotsBooked: metrics?.slots_booked ?? 0,
  });

  const setupComplete = useMemo(
    () =>
      checklist.hasLocation &&
      checklist.hasProvider &&
      checklist.hasService &&
      checklist.hasOpenSlot &&
      checklist.hasOffersSent &&
      checklist.hasConfirmedBooking,
    [checklist],
  );

  const showGettingStarted = !setupComplete;
  const loading = setup.loading || metricsLoading;
  const urgentOpeningsCount = actionQueue.data?.summary.needs_action_count ?? 0;
  const awaitingConfirmationCount = actionQueue.data?.summary.awaiting_confirmation_count ?? 0;

  const setupStepsDone = useMemo(
    () =>
      [
        checklist.hasLocation,
        checklist.hasProvider,
        checklist.hasService,
        checklist.hasOpenSlot,
        checklist.hasOffersSent,
        checklist.hasConfirmedBooking,
      ].filter(Boolean).length,
    [checklist],
  );

  const deskSubtitle = useMemo(() => {
    if (loading) return "Loading your workspace…";
    if (!setupComplete) {
      return (
        <>
          <span style={{ fontWeight: 650, color: "var(--pf-text-primary)" }}>Finish your setup first.</span>
          <span className="pf-muted-copy" style={{ display: "block", marginTop: 10 }}>
            PulseFill needs your services, providers, and locations before it can send openings to customers.
          </span>
        </>
      );
    }
    return "See openings, offers, and what still needs a reply.";
  }, [loading, setupComplete]);

  const nextBest = useMemo(() => {
    if (loading) return null;

    const liveOpen = liveCounts.data?.counts.open ?? 0;
    const offersSent = metrics?.offers_sent ?? 0;
    const slotsBooked = metrics?.slots_booked ?? 0;

    const baseStats = [
      {
        label: "Claims waiting",
        value: awaitingConfirmationCount,
        tone: awaitingConfirmationCount > 0 ? ("attention" as const) : ("idle" as const),
      },
      { label: "Active openings", value: liveOpen, tone: liveOpen > 0 ? ("live" as const) : ("idle" as const) },
      { label: "Offers sent", value: offersSent, tone: offersSent > 0 ? ("live" as const) : ("idle" as const) },
      { label: "Visits rebooked", value: slotsBooked, tone: slotsBooked > 0 ? ("live" as const) : ("idle" as const) },
    ];

    if (awaitingConfirmationCount > 0) {
      return {
        actionKey: `claim-${awaitingConfirmationCount}`,
        priority: "critical" as const,
        title: "Claim waiting for confirmation",
        description: "A customer wants this time. Confirm the booking on your side or release the spot.",
        pipelineStep: "claim" as const,
        supportingStats: baseStats,
        primaryAction: <Link href="/claims" style={actionLinkStyle("primary")}>Open claims</Link>,
      };
    }
    if (!standbyRequests.loading && standbyRequests.count > 0) {
      return {
        actionKey: `standby-${standbyRequests.count}`,
        priority: "attention" as const,
        title: "Waitlist requests to review",
        description: "People asked to get on your waitlist. Approve them so they can receive openings.",
        pipelineStep: "matched" as const,
        supportingStats: baseStats,
        secondaryMeta: `${standbyRequests.count} pending request${standbyRequests.count === 1 ? "" : "s"}`,
        primaryAction: (
          <Link href="/customers/standby-requests" style={actionLinkStyle("primary")}>
            Review waitlist
          </Link>
        ),
      };
    }
    if (!setupComplete) {
      return {
        actionKey: `setup-${setupStepsDone}`,
        priority: "setup" as const,
        title: "Finish your setup",
        description:
          "Add your services, providers, and locations so PulseFill can send openings to the right customers.",
        pipelineStep: "opening" as const,
        supportingStats: [
          { label: "Setup progress", value: `${setupStepsDone}/6`, tone: "live" as const },
          {
            label: "Claims waiting",
            value: awaitingConfirmationCount,
            tone: awaitingConfirmationCount > 0 ? ("attention" as const) : ("idle" as const),
          },
          { label: "Active openings", value: liveOpen, tone: liveOpen > 0 ? ("live" as const) : ("idle" as const) },
          { label: "Openings (saved)", value: setup.openSlotsCount, tone: setup.openSlotsCount > 0 ? ("live" as const) : ("idle" as const) },
        ],
        primaryAction: (
          <Link href={nextSetupHref(checklist)} style={actionLinkStyle("primary")}>
            Add appointment details
          </Link>
        ),
      };
    }
    if (urgentOpeningsCount > 0) {
      return {
        actionKey: `offers-${urgentOpeningsCount}`,
        priority: "attention" as const,
        title: "Openings need offers sent",
        description: "You have matched times — send offers so people on the waitlist can claim them.",
        pipelineStep: "offers" as const,
        supportingStats: baseStats,
        secondaryMeta: `${urgentOpeningsCount} opening${urgentOpeningsCount === 1 ? "" : "s"} need attention`,
        primaryAction: <Link href="/open-slots" style={actionLinkStyle("primary")}>Send offers</Link>,
      };
    }
    if (setup.openSlotsCount === 0) {
      return {
        actionKey: "ready-open",
        priority: "ready" as const,
        title: "Ready for the next cancellation",
        description: "When someone cancels, post the time here and PulseFill walks you through filling it.",
        pipelineStep: "opening" as const,
        supportingStats: baseStats,
        primaryAction: <Link href="/open-slots/create" style={actionLinkStyle("primary")}>Create opening</Link>,
      };
    }
    return {
      actionKey: "clear",
      priority: "clear" as const,
      title: "You're caught up",
      description: "Nothing urgent right now. The next thing to do will show in the card above.",
      pipelineStep: "confirmed" as const,
      supportingStats: baseStats,
      primaryAction: <Link href="/activity" style={actionLinkStyle("secondary")}>View activity</Link>,
    };
  }, [
    loading,
    awaitingConfirmationCount,
    liveCounts.data?.counts.open,
    metrics?.offers_sent,
    metrics?.slots_booked,
    checklist,
    setupComplete,
    standbyRequests.loading,
    standbyRequests.count,
    urgentOpeningsCount,
    setup.openSlotsCount,
    setupStepsDone,
  ]);

  const recoverySubtitle = useMemo(() => {
    if (!dailyOps.data) return DEFAULT_OVERVIEW_RECOVERY_SUBTITLE;
    return buildTodayRecoverySubtitle(dailyOps.data, actionQueue.data?.summary ?? null);
  }, [dailyOps.data, actionQueue.data]);

  const recoveryPipelineStep = useMemo((): RecoveryPipelineStepId | undefined => {
    if (awaitingConfirmationCount > 0) return "claim";
    if (urgentOpeningsCount > 0) return "offers";
    if (metrics && metrics.slots_booked > 0) return "confirmed";
    if (metrics && metrics.offers_sent > 0) return "offers";
    return "opening";
  }, [awaitingConfirmationCount, urgentOpeningsCount, metrics?.slots_booked, metrics?.offers_sent]);

  const pipelineForRail = nextBest?.pipelineStep ?? recoveryPipelineStep;

  const recoveryPipelineCounts = useMemo((): Partial<Record<RecoveryPipelineStepId, number>> | undefined => {
    if (!metrics) return undefined;
    const c: Partial<Record<RecoveryPipelineStepId, number>> = {};
    if (setup.openSlotsCount > 0) c.opening = setup.openSlotsCount;
    if (metrics.offers_sent > 0) c.offers = metrics.offers_sent;
    if (awaitingConfirmationCount > 0) c.claim = awaitingConfirmationCount;
    if (metrics.slots_booked > 0) c.confirmed = metrics.slots_booked;
    return Object.keys(c).length ? c : undefined;
  }, [metrics, setup.openSlotsCount, awaitingConfirmationCount]);

  const pulseLines = useMemo((): OverviewPulseLine[] | null => {
    if (!dailyOps.data) return null;
    const m = dailyOps.data.metrics;
    const q = actionQueue.data?.summary;
    const live = liveCounts.data?.counts;
    const lines: OverviewPulseLine[] = [];
    if (q) {
      lines.push({ label: "Queue · need action", value: q.needs_action_count });
      lines.push({ label: "Queue · in review", value: q.review_count });
    }
    lines.push({ label: "Today · delivery failures", value: m.delivery_failures_today });
    lines.push({ label: "Today · no matches", value: m.no_matches_today });
    if (live) {
      lines.push({ label: "Openings · open / offered", value: live.open });
      lines.push({ label: "Openings · claimed", value: live.claimed });
    }
    if (metrics && metrics.open_slots_created > 0) {
      const rate = Math.min(100, Math.round((metrics.slots_booked / metrics.open_slots_created) * 100));
      lines.push({ label: `${metrics.window_days}d fill rate`, value: `${rate}%` });
    }
    return lines;
  }, [dailyOps.data, actionQueue.data?.summary, liveCounts.data, metrics]);

  const refresh = useCallback(async () => {
    await Promise.all([
      reloadMetrics(),
      setup.reload(),
      actionQueue.reload(),
      liveCounts.reload(),
      dailyOps.reload(),
      opsBreakdown.reload({ silent: true }),
      deliveryReliability.reload({ silent: true }),
      standbyRequests.reload({ silent: true }),
      recoveryHealth.reload({ silent: true }),
      billingSummary.reload(),
    ]);
    setRefreshedAt(new Date());
  }, [
    reloadMetrics,
    setup.reload,
    actionQueue.reload,
    liveCounts.reload,
    dailyOps.reload,
    opsBreakdown.reload,
    deliveryReliability.reload,
    standbyRequests.reload,
    recoveryHealth.reload,
    billingSummary.reload,
  ]);

  useOperatorRefreshSubscription({
    onSlotUpdated: () => {
      void refresh();
    },
  });

  useEffect(() => {
    if (!loading && metrics) setRefreshedAt(new Date());
  }, [loading, metrics]);

  const queueActivity = (
    <div className="pf-overview-desk-stack">
      <DeskSecondaryCard
        title="Needs action"
        headerAction={
          <Link href="/action-queue?section=needs_action" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
            Open queue →
          </Link>
        }
      >
        <ActionQueuePreviewCard
          deckEmbedded
          items={actionQueue.data?.sections.needs_action ?? []}
          loading={actionQueue.loading}
          error={actionQueue.error}
          summary={actionQueue.data?.summary}
          hierarchy="secondary"
        />
      </DeskSecondaryCard>
      <DeskSecondaryCard
        title="Recent activity"
        headerAction={
          <Link href="/activity" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
            View all →
          </Link>
        }
      >
        <CommandCenterRecentActivity hideHeader />
      </DeskSecondaryCard>
    </div>
  );

  return (
    <main
      className="pf-page-overview pf-desk-page pf-overview-desk"
      style={{ padding: 0 }}
      data-pf-overview-setup={showGettingStarted ? "" : undefined}
    >
      <OperatorPageTransition>
        <FadeUp>
          <DeskPageHeader
            title="Today"
            subtitle={deskSubtitle}
            actions={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <RefreshIndicator updatedAt={refreshedAt} />
                <button type="button" className="pf-desk-ghost-btn" style={{ marginTop: 0 }} onClick={() => void refresh()}>
                  Refresh
                </button>
              </div>
            }
          />
        </FadeUp>

        {!billingSummary.loading && billingSummary.data ? (
          <FadeUp delay={0.02}>
            <DeskSecondaryCard title="Billing">
              <BillingNoticeBanner summary={billingSummary.data} tone="administrative" />
            </DeskSecondaryCard>
          </FadeUp>
        ) : null}

        <FadeUp delay={0.05}>
          <div style={{ marginTop: 16 }} id={!setupComplete ? "getting-started" : undefined}>
            <OverviewDeskHero nextBest={nextBest} refreshedAt={refreshedAt} />
          </div>
        </FadeUp>

        <FadeUp delay={0.055}>
          <div className="pf-dashboard-recovery-health" style={{ marginTop: 14 }}>
            <RecoveryHealthPanel
              data={recoveryHealth.data}
              loading={recoveryHealth.loading}
              error={recoveryHealth.error}
              onReload={() => void recoveryHealth.reload()}
            />
          </div>
        </FadeUp>

        {!loading ? (
          <FadeUp delay={0.056}>
            <DeskSecondaryCard title="What happens next">
              <DashboardRecoveryPathSection hideTitle activeStep={pipelineForRail} counts={recoveryPipelineCounts} />
            </DeskSecondaryCard>
          </FadeUp>
        ) : null}

        <FadeUp delay={0.06}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--pf-page-section-gap)" }}>
            {setup.error ? <p style={{ color: "#f87171", margin: 0 }}>Setup data: {setup.error}</p> : null}
            {metricsError ? <p style={{ color: "#f87171", margin: 0 }}>Metrics: {metricsError}</p> : null}
            {dailyOps.error ? <p style={{ color: "#f87171", margin: 0 }}>Daily summary: {dailyOps.error}</p> : null}
            {opsBreakdown.error ? <p style={{ color: "#f87171", margin: 0 }}>Ops breakdown: {opsBreakdown.error}</p> : null}
            {deliveryReliability.error ? (
              <p style={{ color: "#f87171", margin: 0 }}>Delivery reliability: {deliveryReliability.error}</p>
            ) : null}
            {liveCounts.error ? <p style={{ color: "#f87171", margin: 0 }}>Live counts: {liveCounts.error}</p> : null}

            {loading ? <p style={{ color: "var(--muted)", margin: 0 }}>Loading overview…</p> : null}

            {showGettingStarted && !loading ? queueActivity : null}

            {!showGettingStarted && !loading ? (
              <>
                {dailyOps.loading ? (
                  <OverviewRecoveryHeroStrip eyebrow="Today's counts for your time zone.">
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading daily summary…</p>
                  </OverviewRecoveryHeroStrip>
                ) : dailyOps.data ? (
                  <OverviewRecoveryHeroStrip
                    eyebrow="Today's counts for your time zone."
                    subtitle={recoverySubtitle}
                    aside={
                      <OverviewOperationalPulse
                        lines={pulseLines}
                        contextLine={`Coverage for ${dailyOps.data.date} (${dailyOps.data.timezone}).`}
                      />
                    }
                  >
                    <DailyOpsSummaryGrid data={dailyOps.data} />
                    <div style={{ marginTop: 14 }}>
                      <DailyOpsStatusStrip byStatus={dailyOps.data.breakdown?.by_status} />
                    </div>
                  </OverviewRecoveryHeroStrip>
                ) : null}

                <OperatorMorningRecoveryDigestPanel
                  onAfterMutation={async () => {
                    await Promise.all([
                      actionQueue.reload({ silent: true }),
                      dailyOps.reload({ silent: true }),
                      opsBreakdown.reload({ silent: true }),
                      deliveryReliability.reload({ silent: true }),
                    ]);
                  }}
                />

                {queueActivity}

                <OverviewDeliveryReliabilityBlock data={deliveryReliability.data} loading={deliveryReliability.loading} />
                <OverviewOpsBreakdownBlock data={opsBreakdown.data} loading={opsBreakdown.loading} />

                {metrics ? (
                  <OverviewLongRangeRecoveryBlock>
                    <div className="pf-overview-metric-grid">
                      <OverviewMetricCard label="Openings created" value={metrics.open_slots_created} />
                      <OverviewMetricCard label="Offers sent" value={metrics.offers_sent} />
                      <OverviewMetricCard label="Openings booked" value={metrics.slots_booked} />
                      <OverviewMetricCard label="Recovered revenue" value={metrics.recovered_revenue_cents} isCurrency />
                      <OverviewMetricCard label="Openings (list)" value={setup.openSlotsCount} />
                      {liveCounts.data ? (
                        <>
                          <OverviewMetricCard label="Open / offered (live)" value={liveCounts.data.counts.open} />
                          <OverviewMetricCard label="Claimed (live)" value={liveCounts.data.counts.claimed} />
                        </>
                      ) : null}
                    </div>
                  </OverviewLongRangeRecoveryBlock>
                ) : null}
              </>
            ) : null}

            {showGettingStarted && !loading ? (
              <details className="pf-overview-edu">
                <summary>How PulseFill works</summary>
                <p className="pf-overview-edu__body">
                  When a cancellation happens, staff creates an opening, PulseFill sends it to matching standby customers,
                  and claimed openings show up for confirmation in the dashboard.
                </p>
              </details>
            ) : null}
          </div>
        </FadeUp>
      </OperatorPageTransition>
    </main>
  );
}
