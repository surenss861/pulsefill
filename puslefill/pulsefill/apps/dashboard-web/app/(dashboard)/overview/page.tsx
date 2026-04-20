"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionQueuePreviewCard } from "@/components/action-queue/action-queue-preview-card";
import { GettingStartedCard } from "@/components/overview/getting-started-card";
import { OverviewMetricCard } from "@/components/ui/overview-metric-card";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { DailyOpsStatusStrip } from "@/components/overview/daily-ops-status-strip";
import { DailyOpsSummaryGrid } from "@/components/overview/daily-ops-summary-grid";
import { DeliveryReliabilityCard } from "@/components/overview/delivery-reliability-card";
import { OpsBreakdownHighlights } from "@/components/overview/ops-breakdown-highlights";
import { useActionQueue } from "@/hooks/useActionQueue";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";
import { useDailyOpsSummary } from "@/hooks/useDailyOpsSummary";
import { useDeliveryReliability } from "@/hooks/useDeliveryReliability";
import { useOpsBreakdown } from "@/hooks/useOpsBreakdown";
import { useSetupChecklistState } from "@/hooks/useSetupChecklistState";
import { useSetupOverviewData } from "@/hooks/useSetupOverviewData";
import { OperatorMorningRecoveryDigestPanel } from "@/components/workflow/operator-morning-recovery-digest-panel";

export default function OverviewPage() {
  const { metrics, loading: metricsLoading, error: metricsError, reload: reloadMetrics } = useBusinessMetrics();
  const dailyOps = useDailyOpsSummary();
  const opsBreakdown = useOpsBreakdown();
  const deliveryReliability = useDeliveryReliability();
  const actionQueue = useActionQueue(30_000);
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

  const refresh = useCallback(async () => {
    await Promise.all([
      reloadMetrics(),
      setup.reload(),
      actionQueue.reload(),
      dailyOps.reload(),
      opsBreakdown.reload({ silent: true }),
      deliveryReliability.reload({ silent: true }),
    ]);
    setRefreshedAt(new Date());
  }, [reloadMetrics, setup.reload, actionQueue.reload, dailyOps.reload, opsBreakdown.reload, deliveryReliability.reload]);

  useEffect(() => {
    if (!loading && metrics) setRefreshedAt(new Date());
  }, [loading, metrics]);

  return (
    <main style={{ padding: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ marginTop: 0 }}>{showGettingStarted ? "Welcome to PulseFill" : "Overview"}</h1>
          <p style={{ color: "var(--muted)", maxWidth: 560, marginBottom: 0 }}>
            {showGettingStarted
              ? "Set up the basics so PulseFill can start helping recover cancelled appointments."
              : `Last ${metrics?.window_days ?? 30} days for your business (from `}
            {!showGettingStarted ? (
              <>
                <code style={{ color: "var(--primary)" }}>GET /v1/businesses/mine/metrics</code>).
              </>
            ) : null}
          </p>
        </div>
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

      {loading ? <p style={{ color: "var(--muted)", marginTop: 20 }}>Loading overview…</p> : null}

      {showGettingStarted && !loading ? <GettingStartedCard state={checklist} /> : null}

      {!showGettingStarted && !loading ? (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 650 }}>Today&apos;s recovery</h2>
          {dailyOps.loading ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading daily summary…</p>
          ) : dailyOps.data ? (
            <>
              <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--muted)" }}>
                Operational pulse for {dailyOps.data.date} ({dailyOps.data.timezone}).
              </p>
              <DailyOpsSummaryGrid data={dailyOps.data} />
              <div style={{ marginTop: 14 }}>
                <DailyOpsStatusStrip byStatus={dailyOps.data.breakdown?.by_status} />
              </div>
              {opsBreakdown.loading ? (
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 20 }}>Loading recovery breakdown…</p>
              ) : opsBreakdown.data ? (
                <div style={{ marginTop: 22 }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 16, fontWeight: 650 }}>Where today&apos;s recovery is happening</h3>
                  <OpsBreakdownHighlights data={opsBreakdown.data} />
                </div>
              ) : null}
              {deliveryReliability.loading ? (
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 16 }}>Loading delivery reliability…</p>
              ) : deliveryReliability.data ? (
                <div style={{ marginTop: 16 }}>
                  <DeliveryReliabilityCard data={deliveryReliability.data} />
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {!showGettingStarted && !loading ? (
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
      ) : null}

      {metrics && !loading ? (
        <div
          style={{
            marginTop: 24,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <OverviewMetricCard label="Open slots created" value={metrics.open_slots_created} />
          <OverviewMetricCard label="Offers sent" value={metrics.offers_sent} />
          <OverviewMetricCard label="Slots booked" value={metrics.slots_booked} />
          <OverviewMetricCard label="Recovered revenue" value={metrics.recovered_revenue_cents} isCurrency />
          <OverviewMetricCard label="Open slots (now)" value={setup.openSlotsCount} />
        </div>
      ) : null}

      {!loading ? (
        <ActionQueuePreviewCard
          items={actionQueue.data?.sections.needs_action ?? []}
          loading={actionQueue.loading}
          error={actionQueue.error}
        />
      ) : null}

      {showGettingStarted && !loading ? (
        <div
          style={{
            marginTop: 24,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            padding: 24,
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
            When a cancellation happens, staff creates an open slot, PulseFill sends it to matching standby
            customers, and claimed openings show up for confirmation in the dashboard.
          </p>
        </div>
      ) : null}
    </main>
  );
}
