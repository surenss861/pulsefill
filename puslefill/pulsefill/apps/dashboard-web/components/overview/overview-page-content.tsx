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
import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

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
  const secondaryAction =
    checklist.hasOffersSent || checklist.hasOpenSlot
      ? { href: "/open-slots", label: "View openings" }
      : { href: "/customers", label: "Invite customers" };
  const awaitingConfirmationCount = actionQueue.data?.summary.awaiting_confirmation_count ?? 0;
  const compactMetrics = useMemo(
    () => [
      {
        label: "Active openings",
        value: liveCounts.data?.counts.open ?? 0,
      },
      {
        label: "Offers sent",
        value: metrics?.offers_sent ?? 0,
      },
      {
        label: "Claims waiting",
        value: awaitingConfirmationCount,
      },
      {
        label: "Recovered bookings",
        value: metrics?.slots_booked ?? 0,
      },
    ],
    [liveCounts.data?.counts.open, metrics?.offers_sent, metrics?.slots_booked, awaitingConfirmationCount],
  );

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
    <main style={{ padding: 0 }}>
      <FadeUp>
        <OverviewOperatorHero
          urgentOpeningsCount={urgentOpeningsCount}
          awaitingConfirmationCount={awaitingConfirmationCount}
          secondaryHref={secondaryAction.href}
          secondaryLabel={secondaryAction.label}
        />
      </FadeUp>

      <FadeUp delay={0.06}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--pf-page-section-gap)" }}>
      {!standbyRequests.loading && standbyRequests.count > 0 ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 16,
            border: "1px solid rgba(251, 191, 36, 0.28)",
            background: "rgba(245, 158, 11, 0.08)",
            padding: "14px 16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "rgba(253, 224, 171, 0.95)" }}>Standby requests</p>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(245, 247, 250, 0.78)", maxWidth: 520 }}>
              {standbyRequests.count} customer{standbyRequests.count === 1 ? "" : "s"} asked to join standby. Review them when you can.
            </p>
          </div>
          <Link
            href="/customers/standby-requests"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--pf-accent-primary)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Review requests
          </Link>
        </div>
      ) : null}

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

      {!loading ? (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          }}
        >
          {compactMetrics.map((m) => (
            <div
              key={m.label}
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                padding: "12px 14px",
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{m.label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 650, letterSpacing: "-0.01em" }}>{m.value}</p>
            </div>
          ))}
        </div>
      ) : null}

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
        <div className="pf-command-cockpit">
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
              activeStep={recoveryPipelineStep}
              counts={recoveryPipelineCounts}
              compact
              animated
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

          <div className="pf-command-cockpit">
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
                activeStep={recoveryPipelineStep}
                counts={recoveryPipelineCounts}
                compact
                animated
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
