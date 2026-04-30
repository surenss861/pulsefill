"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionQueuePreviewCard } from "@/components/action-queue/action-queue-preview-card";
import { GettingStartedCard } from "@/components/overview/getting-started-card";
import { OverviewOperatorHero } from "@/components/overview/overview-operator-hero";
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
import { FadeUp } from "@/components/motion/operator-motion";
import { buildTodayRecoverySubtitle } from "@/lib/overview-live-copy";
import { NextBestActionCard } from "@/components/operator/next-best-action-card";
import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import type { SetupChecklistState } from "@/hooks/useSetupChecklistState";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

function nextSetupHref(state: SetupChecklistState): string {
  if (!state.hasLocation) return "/locations";
  if (!state.hasProvider) return "/providers";
  if (!state.hasService) return "/services";
  if (!state.hasOpenSlot) return "/open-slots/create";
  if (!state.hasOffersSent) return "/customers";
  if (!state.hasConfirmedBooking) return "/claims";
  return "/locations";
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
  const setup = useSetupOverviewData();
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

  const nextBest = useMemo(() => {
    if (loading) return null;

    const liveOpen = liveCounts.data?.counts.open ?? 0;
    const offersSent = metrics?.offers_sent ?? 0;
    const slotsBooked = metrics?.slots_booked ?? 0;
    const setupStepsDone = [
      checklist.hasLocation,
      checklist.hasProvider,
      checklist.hasService,
      checklist.hasOpenSlot,
      checklist.hasOffersSent,
      checklist.hasConfirmedBooking,
    ].filter(Boolean).length;

    const baseStats = [
      {
        label: "Claims waiting",
        value: awaitingConfirmationCount,
        tone: awaitingConfirmationCount > 0 ? ("attention" as const) : ("idle" as const),
      },
      { label: "Active openings", value: liveOpen, tone: liveOpen > 0 ? ("live" as const) : ("idle" as const) },
      { label: "Offers sent", value: offersSent, tone: offersSent > 0 ? ("live" as const) : ("idle" as const) },
      { label: "Recovered", value: slotsBooked, tone: slotsBooked > 0 ? ("live" as const) : ("idle" as const) },
    ];

    if (awaitingConfirmationCount > 0) {
      return {
        actionKey: `claim-${awaitingConfirmationCount}`,
        priority: "critical" as const,
        title: "Claim waiting for confirmation",
        description: "A customer wants this opening. Confirm the booking or release the spot.",
        pipelineStep: "claim" as const,
        supportingStats: baseStats,
        primaryAction: <Link href="/claims" style={actionLinkStyle("primary")}>Review claim</Link>,
      };
    }
    if (!standbyRequests.loading && standbyRequests.count > 0) {
      return {
        actionKey: `standby-${standbyRequests.count}`,
        priority: "attention" as const,
        title: "Standby requests waiting",
        description:
          "Customers are asking to join your standby pool. Review them so they can receive openings.",
        pipelineStep: "matched" as const,
        supportingStats: baseStats,
        secondaryMeta: `${standbyRequests.count} pending request${standbyRequests.count === 1 ? "" : "s"}`,
        primaryAction: (
          <Link href="/customers/standby-requests" style={actionLinkStyle("primary")}>
            Review requests
          </Link>
        ),
      };
    }
    if (!setupComplete) {
      return {
        actionKey: `setup-${setupStepsDone}`,
        priority: "setup" as const,
        title: "Finish workspace setup",
        description:
          "Complete your services, providers, and locations so openings can be matched correctly.",
        pipelineStep: "opening" as const,
        supportingStats: [
          { label: "Workspace steps", value: `${setupStepsDone}/6`, tone: "live" as const },
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
            Continue setup
          </Link>
        ),
      };
    }
    if (urgentOpeningsCount > 0) {
      return {
        actionKey: `offers-${urgentOpeningsCount}`,
        priority: "attention" as const,
        title: "Openings ready for offers",
        description: "Send matched offers so standby customers can claim available times.",
        pipelineStep: "offers" as const,
        supportingStats: baseStats,
        secondaryMeta: `${urgentOpeningsCount} opening${urgentOpeningsCount === 1 ? "" : "s"} need attention`,
        primaryAction: <Link href="/open-slots" style={actionLinkStyle("primary")}>Review openings</Link>,
      };
    }
    if (setup.openSlotsCount === 0) {
      return {
        actionKey: "ready-open",
        priority: "ready" as const,
        title: "Ready for the next cancellation",
        description: "Create an opening when a customer cancels and PulseFill will guide the recovery flow.",
        pipelineStep: "opening" as const,
        supportingStats: baseStats,
        primaryAction: <Link href="/open-slots/create" style={actionLinkStyle("primary")}>Create opening</Link>,
      };
    }
    return {
      actionKey: "clear",
      priority: "clear" as const,
      title: "Recovery system is clear",
      description: "No urgent actions right now. PulseFill will surface the next recovery move here.",
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
  ]);

  useOperatorRefreshSubscription({
    onSlotUpdated: () => {
      void refresh();
    },
  });

  useEffect(() => {
    if (!loading && metrics) setRefreshedAt(new Date());
  }, [loading, metrics]);

  return (
    <main className="pf-page-overview" style={{ padding: 0 }}>
      <FadeUp>
        <OverviewOperatorHero />
      </FadeUp>

      {nextBest ? (
        <FadeUp delay={0.05}>
          <div style={{ marginTop: 16 }}>
            <NextBestActionCard
              actionKey={nextBest.actionKey}
              title={nextBest.title}
              description={nextBest.description}
              priority={nextBest.priority}
              primaryAction={nextBest.primaryAction}
              secondaryMeta={nextBest.secondaryMeta}
              pipelineStep={nextBest.pipelineStep}
              supportingStats={nextBest.supportingStats}
              showPipeline={false}
              updatedAt={refreshedAt}
            />
          </div>
        </FadeUp>
      ) : null}

      <FadeUp delay={0.06}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--pf-page-section-gap)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginTop: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RefreshIndicator updatedAt={refreshedAt} />
          <button
            type="button"
            onClick={() => void refresh()}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              padding: "8px 14px",
              fontSize: 13,
              cursor: "pointer",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {setup.error ? (
        <p style={{ color: "#f87171", marginTop: 16 }}>Setup data: {setup.error}</p>
      ) : null}
      {metricsError ? <p style={{ color: "#f87171", marginTop: 8 }}>Metrics: {metricsError}</p> : null}
      {dailyOps.error ? <p style={{ color: "#f87171", marginTop: 8 }}>Daily summary: {dailyOps.error}</p> : null}
      {opsBreakdown.error ? <p style={{ color: "#f87171", marginTop: 8 }}>Ops breakdown: {opsBreakdown.error}</p> : null}
      {deliveryReliability.error ? (
        <p style={{ color: "#f87171", marginTop: 8 }}>Delivery reliability: {deliveryReliability.error}</p>
      ) : null}
      {liveCounts.error ? <p style={{ color: "#f87171", marginTop: 8 }}>Live counts: {liveCounts.error}</p> : null}

      {loading ? <p style={{ color: "var(--muted)", marginTop: 20 }}>Loading overview…</p> : null}

      {showGettingStarted && !loading ? (
        <div className="pf-command-cockpit pf-command-cockpit--after-nba">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--pf-page-section-gap)" }}>
            <GettingStartedCard state={checklist} />
            <ActionQueuePreviewCard
              items={actionQueue.data?.sections.needs_action ?? []}
              loading={actionQueue.loading}
              error={actionQueue.error}
              summary={actionQueue.data?.summary}
            />
          </div>
          <aside className="pf-command-cockpit-rail">
            <RecoveryPipeline
              activeStep={pipelineForRail}
              counts={recoveryPipelineCounts}
              compact
              animated
              featured
            />
          </aside>
          <div className="pf-command-cockpit-footer">
            <CommandCenterRecentActivity />
          </div>
        </div>
      ) : null}

      {!showGettingStarted && !loading ? (
        <>
          {dailyOps.loading ? (
            <OverviewRecoveryHeroStrip eyebrow="Live view of today's cancellation recovery workflow.">
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading daily summary…</p>
            </OverviewRecoveryHeroStrip>
          ) : dailyOps.data ? (
            <OverviewRecoveryHeroStrip
              eyebrow="Live view of today's cancellation recovery workflow."
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

          <div className="pf-command-cockpit pf-command-cockpit--after-nba">
            <div style={{ minWidth: 0 }}>
              <ActionQueuePreviewCard
                items={actionQueue.data?.sections.needs_action ?? []}
                loading={actionQueue.loading}
                error={actionQueue.error}
                summary={actionQueue.data?.summary}
              />
            </div>
            <aside className="pf-command-cockpit-rail">
              <RecoveryPipeline
                activeStep={pipelineForRail}
                counts={recoveryPipelineCounts}
                compact
                animated
                featured
              />
            </aside>
            <div className="pf-command-cockpit-footer">
              <CommandCenterRecentActivity />
            </div>
          </div>

          <OverviewDeliveryReliabilityBlock data={deliveryReliability.data} loading={deliveryReliability.loading} />
          <OverviewOpsBreakdownBlock data={opsBreakdown.data} loading={opsBreakdown.loading} />

          {metrics ? (
            <OverviewLongRangeRecoveryBlock>
              <div
                style={{
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                }}
              >
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
        <div
          style={{
            marginTop: 24,
            padding: 22,
            ...operatorSurfaceShell("operational"),
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 650, letterSpacing: "-0.02em" }}>
            How PulseFill works
          </h2>
          <p
            style={{
              margin: "10px 0 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--muted)",
              maxWidth: 640,
            }}
          >
            When a cancellation happens, staff creates an opening, PulseFill sends it to matching standby
            customers, and claimed openings show up for confirmation in the dashboard.
          </p>
        </div>
      ) : null}
        </div>
      </FadeUp>
    </main>
  );
}
