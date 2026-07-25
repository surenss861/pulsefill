"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { getOpenSlotBackLink } from "@/lib/open-slot-routes";
import { formatSlotRange } from "@/lib/format-slot-range";
import { OpenSlotLogsPanel } from "@/components/open-slot-detail/open-slot-logs-panel";
import { NotificationAttemptsPanel } from "@/components/open-slot-detail/notification-attempts-panel";
import { NotificationDeliveryStatusSection } from "@/components/open-slot-detail/notification-delivery-status-section";
import { NotificationLogsInspector } from "@/components/slots/notification-logs-inspector";
import { SlotDeliverySummary } from "@/components/slots/slot-delivery-summary";
import { OperatorInternalNoteCard } from "@/components/slots/operator-internal-note-card";
import { SlotAttentionCues } from "@/components/slots/slot-attention-cues";
import { OperatorSlotActionBar } from "@/components/slots/operator-slot-action-bar";
import { OperatorSlotOffersSummary } from "@/components/slots/operator-slot-offers-summary";
import { PaymentStatusCard } from "@/components/slots/payment-status-card";
import { NoMatchExplanationPanel } from "@/components/open-slot-detail/no-match-explanation-panel";
import { OperatorSlotReasonBanner } from "@/components/slots/operator-slot-reason-banner";
import { SlotOffersInspector } from "@/components/slots/slot-offers-inspector";
import { SlotTimeline } from "@/components/slots/slot-timeline";
import { SlotDetailFactsGrid } from "@/components/slots/slot-detail-hero";
import { SlotRecentActivityBar } from "@/components/slots/slot-recent-activity-bar";
import { StateChip } from "@/components/ui/state-chip";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { OperatorCustomerContextSection } from "@/components/customers/operator-customer-context-section";
import { useNotificationDelivery } from "@/hooks/useNotificationDelivery";
import { useNotificationLogs } from "@/hooks/useNotificationLogs";
import { useNotificationAttempts } from "@/hooks/useNotificationAttempts";
import { useNoMatchExplanation } from "@/hooks/useNoMatchExplanation";
import { useOpenSlotDetail } from "@/hooks/useOpenSlotDetail";
import { useOpenSlotRealtime } from "@/hooks/useOpenSlotRealtime";
import { usePollingEffect } from "@/hooks/usePollingEffect";
import { useSlotFormOptions } from "@/hooks/useSlotFormOptions";
import { useOperatorCustomerContext } from "@/hooks/useOperatorCustomerContext";
import { useSlotTimeline } from "@/hooks/useSlotTimeline";
import { useBillingSummary } from "@/hooks/useBillingSummary";
import { BillingInlineGuardrail } from "@/components/billing/billing-inline-guardrail";
import type { OperatorSlotQueueCategory, OperatorSlotQueueContext } from "@/types/open-slot-detail";
import { isSlotRecoveryTerminalStatus, slotStatusToRecoveryPipelineActiveStep } from "@/lib/slot-recovery-pipeline";

function queueCategoryChipLabel(ctx: OperatorSlotQueueContext): string | null {
  if (ctx.reason_title) return ctx.reason_title;
  const c = ctx.current_category;
  if (!c) return null;
  const map: Record<OperatorSlotQueueCategory, string> = {
    awaiting_confirmation: "Awaiting confirmation",
    delivery_failed: "Delivery issue",
    retry_recommended: "Retry recommended",
    no_matches: "No matching standby customers",
    offered_active: "Offers active",
    expired_unfilled: "Expired unfilled",
    confirmed_booking: "Confirmed",
  };
  return map[c] ?? null;
}

function queueCategoryToStatusKind(category: OperatorSlotQueueCategory | null): OperatorStatusKind | null {
  if (!category) return null;
  const map: Record<OperatorSlotQueueCategory, OperatorStatusKind> = {
    awaiting_confirmation: "attention",
    delivery_failed: "failed",
    retry_recommended: "pending",
    no_matches: "attention",
    offered_active: "pending",
    expired_unfilled: "expired",
    confirmed_booking: "confirmed",
  };
  return map[category] ?? "pending";
}

function terminalRecoveryCopy(status: string): string {
  const s = status.toLowerCase();
  if (s === "expired") return "This opening expired before a booking was confirmed.";
  if (s === "cancelled") return "This opening was cancelled.";
  if (s === "failed") return "This opening is in a failed state — review delivery and notes before closing it out.";
  return "This opening is no longer active.";
}

export function OpenSlotDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const slotId = params?.id;
  const { slot, queueContext, availableActions, loading, error, reload } = useOpenSlotDetail(slotId);
  const noMatch = useNoMatchExplanation(slot?.id);
  const options = useSlotFormOptions();
  const {
    events: timelineEvents,
    loading: timelineLoading,
    error: timelineError,
    reload: reloadTimeline,
  } = useSlotTimeline(slotId);
  const {
    logs: notificationLogs,
    loading: notificationLogsLoading,
    error: notificationLogsError,
    reload: reloadNotificationLogs,
  } = useNotificationLogs(slotId);
  const {
    data: notificationDelivery,
    loading: notificationDeliveryLoading,
    error: notificationDeliveryError,
    reload: reloadNotificationDelivery,
  } = useNotificationDelivery(slotId);
  const {
    attempts: notificationAttempts,
    loading: notificationAttemptsLoading,
    error: notificationAttemptsError,
    reload: reloadNotificationAttempts,
  } = useNotificationAttempts(slotId);
  const claimId = slot?.winning_claim?.id;
  const winningCustomerId = slot?.winning_claim?.customer_id;
  const customerCtx = useOperatorCustomerContext(winningCustomerId);
  const billingSummary = useBillingSummary();
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const { serviceLabel, locationLabel, namesLoading } = useMemo(() => {
    if (!slot) {
      return { serviceLabel: "—", locationLabel: "—", namesLoading: false };
    }
    const needOptions = Boolean(slot.service_id || slot.location_id);
    const loadingNames = options.loading && needOptions;

    let s = "—";
    if (slot.service_id) {
      s = options.services.find((x) => x.id === slot.service_id)?.name ?? "Unknown";
    }
    let l = "—";
    if (slot.location_id) {
      l = options.locations.find((x) => x.id === slot.location_id)?.name ?? "Unknown";
    }

    return { serviceLabel: s, locationLabel: l, namesLoading: loadingNames };
  }, [slot, options.loading, options.services, options.locations]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      reload(),
      reloadTimeline(),
      reloadNotificationLogs(),
      reloadNotificationDelivery(),
      reloadNotificationAttempts(),
      options.reload(),
      customerCtx.reload(),
      noMatch.reload(),
      billingSummary.reload(),
    ]);
    setRefreshedAt(new Date());
  }, [
    reload,
    reloadTimeline,
    reloadNotificationLogs,
    reloadNotificationDelivery,
    reloadNotificationAttempts,
    options.reload,
    customerCtx.reload,
    noMatch.reload,
    billingSummary.reload,
  ]);

  const silentRefresh = useCallback(async () => {
    await Promise.all([
      reload({ silent: true }),
      reloadTimeline({ silent: true }),
      reloadNotificationLogs({ silent: true }),
      reloadNotificationDelivery({ silent: true }),
      reloadNotificationAttempts({ silent: true }),
      customerCtx.reload(),
      noMatch.reload(),
      billingSummary.reload(),
    ]);
    setRefreshedAt(new Date());
  }, [
    reload,
    reloadTimeline,
    reloadNotificationLogs,
    reloadNotificationDelivery,
    reloadNotificationAttempts,
    customerCtx.reload,
    noMatch.reload,
    billingSummary.reload,
  ]);

  useEffect(() => {
    if (!loading && slot) setRefreshedAt(new Date());
  }, [loading, slot]);

  usePollingEffect(
    () => {
      void silentRefresh();
    },
    12000,
    Boolean(slotId) && !loading && Boolean(slot),
  );

  useOpenSlotRealtime(
    slotId,
    () => {
      void silentRefresh();
    },
    Boolean(slotId) && !loading && Boolean(slot),
  );

  const queueChip = queueContext ? queueCategoryChipLabel(queueContext) : null;

  const back = useMemo(
    () =>
      getOpenSlotBackLink({
        from: searchParams.get("from"),
        section: searchParams.get("section"),
        status: searchParams.get("status"),
        attention: searchParams.get("attention"),
        q: searchParams.get("q"),
        digest: searchParams.get("digest"),
        digest_slot_ids: searchParams.get("digest_slot_ids"),
      }),
    [searchParams],
  );

  const sourceChip = useMemo(() => {
    const f = searchParams.get("from");
    if (f === "queue") return "From queue";
    if (f === "slots") return "From Openings";
    if (f === "activity") return "From Activity";
    if (f === "claims") return "From Claims";
    if (f === "outcomes") return "From Outcomes";
    return null;
  }, [searchParams]);

  const scrollToRecoverySection = useCallback((step: RecoveryPipelineStepId) => {
    const ids: Record<RecoveryPipelineStepId, string> = {
      opening: "pf-slot-scroll-appointment",
      matched: "pf-slot-scroll-appointment",
      offers: "pf-slot-scroll-workflow",
      claim: "pf-slot-scroll-workflow",
      confirmed: "pf-slot-scroll-timeline",
    };
    document.getElementById(ids[step])?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const visitTitle = useMemo(() => {
    if (!slot) return "Opening";
    const raw = slot.notes?.trim();
    if (raw) return raw.split("\n")[0].trim().slice(0, 120);
    if (serviceLabel && serviceLabel !== "—" && serviceLabel !== "Unknown") return serviceLabel;
    return slot.provider_name_snapshot?.trim() || "Appointment opening";
  }, [slot, serviceLabel]);

  const slotTimeLabel = useMemo(() => {
    if (!slot?.starts_at || !slot?.ends_at) return "—";
    return formatSlotRange(slot.starts_at, slot.ends_at);
  }, [slot]);

  const contextLine = useMemo(() => {
    if (!slot) return "";
    const loc = namesLoading ? "…" : locationLabel;
    const parts = [loc !== "—" ? loc : null, slot.provider_name_snapshot?.trim()].filter(Boolean);
    return parts.join(" · ");
  }, [slot, locationLabel, namesLoading]);

  const heroEyebrow = queueChip ?? undefined;

  const headerActions = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      <Link href={back.href} prefetch={false} className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
        {back.label}
      </Link>
      {sourceChip ? (
        <span className="pf-muted-copy" style={{ fontSize: 12 }}>
          {sourceChip}
        </span>
      ) : null}
      <RefreshIndicator updatedAt={refreshedAt} />
    </div>
  );

  return (
    <main className="pf-page-slot-detail pf-desk-page" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <div className="pf-overview-desk-stack">
          <DeskPageHeader
            title="Opening"
            subtitle="This cancelled appointment time, what happened so far, and what to do next."
            actions={headerActions}
          />

          {loading ? (
            <OperatorLoadingState
              variant="section"
              skeleton="form"
              title="Loading opening…"
              description="Pulling up this opening, its offers, and where it sits for customers."
            />
          ) : null}
          {error ? (
            <div>
              <OperatorErrorState
                rawMessage={error}
                primaryAction={
                  <button
                    type="button"
                    onClick={() => void reload()}
                    style={{
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.06)",
                      padding: "8px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "var(--text)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Retry
                  </button>
                }
              />
            </div>
          ) : null}

          {slot && !loading ? (
            <SlotRecentActivityBar
              slot={slot}
              timelineEvents={timelineEvents}
              notificationLogs={notificationLogs}
              refreshedAt={refreshedAt}
            />
          ) : null}

          {slot && !loading ? (
            <>
              <DeskHeroCard title={visitTitle} titleId="pf-slot-desk-hero-title" eyebrow={heroEyebrow}>
                <p className="pf-desk-hero-card__meta">{slotTimeLabel}</p>
                {contextLine ? (
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
                    {contextLine}
                  </p>
                ) : null}
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <StateChip status={slot.status} />
                  {queueChip ? (
                    <OperatorStatusChip
                      kind={queueCategoryToStatusKind(queueContext?.current_category ?? null) ?? "pending"}
                      label={queueChip}
                    />
                  ) : null}
                </div>
                {isSlotRecoveryTerminalStatus(slot.status) ? (
                  <p className="pf-muted-copy" style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55 }}>
                    {terminalRecoveryCopy(slot.status)}
                  </p>
                ) : (
                  <p className="pf-muted-copy" style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55 }}>
                    Send offers to waiting customers, watch for a claim, then confirm the booking to close the loop.
                  </p>
                )}
                {!billingSummary.loading && billingSummary.data ? (
                  <div style={{ marginTop: 14 }}>
                    <BillingInlineGuardrail summary={billingSummary.data} />
                  </div>
                ) : null}
                <div style={{ marginTop: 16 }}>
                  <OperatorSlotActionBar
                    openSlotId={slot.id}
                    slotStatus={slot.status}
                    queueCategory={queueContext?.current_category ?? null}
                    claimId={claimId}
                    availableActions={availableActions}
                    onMutationsDone={() => void refreshAll()}
                    onAddNote={() => document.getElementById("operator-slot-internal-note")?.scrollIntoView({ behavior: "smooth" })}
                    onInspectLogs={() =>
                      document.getElementById("operator-slot-notification-logs")?.scrollIntoView({ behavior: "smooth" })
                    }
                  />
                </div>
              </DeskHeroCard>

              <OperatorSlotReasonBanner queueContext={queueContext} />

              <NoMatchExplanationPanel
                visible={
                  queueContext?.current_category === "no_matches" || Boolean(noMatch.data?.has_explanation)
                }
                data={noMatch.data}
                loading={noMatch.loading}
                error={noMatch.error}
                onRetry={() => void noMatch.reload()}
              />

              <SlotAttentionCues slot={slot} logs={notificationLogs} />

              <section id="pf-slot-scroll-appointment" style={{ scrollMarginTop: 96 }}>
                <DeskSecondaryCard title="Appointment details">
                  <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55 }}>
                    Service, provider, location, and recent activity for this opening.
                  </p>
                  <SlotDetailFactsGrid
                    variant="desk"
                    slot={slot}
                    serviceLabel={serviceLabel}
                    locationLabel={locationLabel}
                    namesLoading={namesLoading}
                  />
                  <p className="pf-muted-copy" style={{ margin: "12px 0 0", fontSize: 12 }}>
                    Last refreshed:{" "}
                    {refreshedAt
                      ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(refreshedAt)
                      : "—"}
                  </p>
                </DeskSecondaryCard>
              </section>

              <PaymentStatusCard slot={slot} onRefunded={() => void refreshAll()} />

              {slot.notes ? (
                <DeskSecondaryCard title="Opening notes">
                  <p className="pf-muted-copy" style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.55 }}>
                    Shown to customers where this opening appears.
                  </p>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--pf-text-primary)" }}>{slot.notes}</p>
                </DeskSecondaryCard>
              ) : null}

              <section id="pf-slot-scroll-workflow" style={{ scrollMarginTop: 96 }}>
                <DeskSecondaryCard title="Customer request">
                  <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55 }}>
                    When someone claims this time, confirm the booking once it is on the schedule.
                  </p>
                  <div style={{ display: "grid", gap: 16 }}>
                    <OperatorSlotOffersSummary slot={slot} />
                    <SlotOffersInspector slot={slot} />
                  </div>
                </DeskSecondaryCard>
              </section>

              <DeskSecondaryCard title="Messages & delivery">
                <div style={{ display: "grid", gap: 14 }}>
                  <SlotDeliverySummary
                    summary={notificationDelivery?.summary ?? null}
                    loading={notificationDeliveryLoading}
                  />
                  <NotificationDeliveryStatusSection
                    loading={notificationDeliveryLoading}
                    error={notificationDeliveryError}
                    items={notificationDelivery?.items ?? []}
                    summary={notificationDelivery?.summary ?? null}
                  />
                </div>
              </DeskSecondaryCard>

              <div id="operator-slot-internal-note">
                <DeskSecondaryCard title="Team notes">
                  <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.55 }}>
                    Staff only — saved notes appear on the timeline so the next person has context.
                  </p>
                  <OperatorInternalNoteCard
                    openSlotId={slot.id}
                    initialNote={slot.internal_note}
                    initialResolutionStatus={slot.resolution_status}
                    initialUpdatedAt={slot.internal_note_updated_at}
                    onSaved={() => void silentRefresh()}
                  />
                </DeskSecondaryCard>
              </div>

              <section id="pf-slot-scroll-timeline" style={{ scrollMarginTop: 96 }}>
                <DeskSecondaryCard title="What happened">
                  <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55 }}>
                    Opening created, offers, claims, and confirmations in order.
                  </p>
                  {timelineLoading ? <p className="pf-muted-copy">Loading timeline…</p> : null}
                  {timelineError ? <p style={{ color: "#f87171" }}>{timelineError}</p> : null}
                  {!timelineLoading ? <SlotTimeline events={timelineEvents} /> : null}
                </DeskSecondaryCard>
              </section>

              <DeskSecondaryCard title="Message attempts">
                {notificationAttemptsLoading ? <p className="pf-muted-copy">Loading message attempts…</p> : null}
                {notificationAttemptsError ? <p style={{ color: "#f87171" }}>{notificationAttemptsError}</p> : null}
                {!notificationAttemptsLoading && !notificationAttemptsError && notificationAttempts.length > 0 ? (
                  <OpenSlotLogsPanel summaryLabel="Message delivery records">
                    <NotificationAttemptsPanel attempts={notificationAttempts} />
                  </OpenSlotLogsPanel>
                ) : null}
                {!notificationAttemptsLoading && !notificationAttemptsError && notificationAttempts.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(245,247,250,0.45)" }}>
                    No message attempts for this opening yet.
                  </p>
                ) : null}
              </DeskSecondaryCard>

              <div id="operator-slot-notification-logs">
                <DeskSecondaryCard title="Detailed notification history">
                  <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55 }}>
                    Expand rows for delivery status and provider outcomes.
                  </p>
                  {notificationLogsLoading ? <p className="pf-muted-copy">Loading notification history…</p> : null}
                  {notificationLogsError ? <p style={{ color: "#f87171" }}>{notificationLogsError}</p> : null}
                  {!notificationLogsLoading && !notificationLogsError && notificationLogs.length > 0 ? (
                    <OpenSlotLogsPanel summaryLabel="Notification history details">
                      <NotificationLogsInspector logs={notificationLogs} />
                    </OpenSlotLogsPanel>
                  ) : null}
                  {!notificationLogsLoading && !notificationLogsError && notificationLogs.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(245,247,250,0.45)" }}>
                      No notification history for this opening yet.
                    </p>
                  ) : null}
                </DeskSecondaryCard>
              </div>

              {!isSlotRecoveryTerminalStatus(slot.status) ? (
                <DeskSecondaryCard title="What happens next">
                  <RecoveryPipeline
                    activeStep={slotStatusToRecoveryPipelineActiveStep(slot.status)}
                    compact
                    animated
                    showFlowLabel={false}
                    interactive
                    onStepSelect={scrollToRecoverySection}
                    sentenceCaseTitles
                    stepNumbers
                    style={{
                      background: "transparent",
                      boxShadow: "none",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "10px 8px",
                    }}
                  />
                </DeskSecondaryCard>
              ) : null}

              {queueContext?.reason_detail?.trim() ? (
                <DeskSecondaryCard title="Why this looks like this">
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                    {queueContext.reason_detail.length > 280
                      ? `${queueContext.reason_detail.slice(0, 280)}…`
                      : queueContext.reason_detail}
                  </p>
                </DeskSecondaryCard>
              ) : null}

              {winningCustomerId ? (
                <DeskSecondaryCard title="Customer on this opening">
                  <OperatorCustomerContextSection
                    loading={customerCtx.loading}
                    error={customerCtx.error}
                    data={customerCtx.data}
                  />
                </DeskSecondaryCard>
              ) : null}
            </>
          ) : null}
        </div>
      </OperatorPageTransition>
    </main>
  );
}
