"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getOpenSlotBackLink } from "@/lib/open-slot-routes";
import { OpenSlotDetailSection } from "@/components/open-slot-detail/open-slot-detail-section";
import { OpenSlotDetailToolbar } from "@/components/open-slot-detail/open-slot-detail-toolbar";
import { OpenSlotLogsPanel } from "@/components/open-slot-detail/open-slot-logs-panel";
import { NotificationAttemptsPanel } from "@/components/open-slot-detail/notification-attempts-panel";
import { NotificationLogsInspector } from "@/components/slots/notification-logs-inspector";
import { SlotDeliverySummary } from "@/components/slots/slot-delivery-summary";
import { OperatorInternalNoteCard } from "@/components/slots/operator-internal-note-card";
import { SlotAttentionCues } from "@/components/slots/slot-attention-cues";
import { OperatorSlotActionBar } from "@/components/slots/operator-slot-action-bar";
import { OperatorSlotOffersSummary } from "@/components/slots/operator-slot-offers-summary";
import { OperatorSlotReasonBanner } from "@/components/slots/operator-slot-reason-banner";
import { SlotOffersInspector } from "@/components/slots/slot-offers-inspector";
import { SlotTimeline } from "@/components/slots/slot-timeline";
import { SlotDetailFactsGrid, SlotDetailIdentityHeader } from "@/components/slots/slot-detail-hero";
import { SlotRecentActivityBar } from "@/components/slots/slot-recent-activity-bar";
import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { OperatorCustomerContextSection } from "@/components/customers/operator-customer-context-section";
import { useNotificationLogs } from "@/hooks/useNotificationLogs";
import { useNotificationAttempts } from "@/hooks/useNotificationAttempts";
import { useOpenSlotDetail } from "@/hooks/useOpenSlotDetail";
import { useOpenSlotRealtime } from "@/hooks/useOpenSlotRealtime";
import { usePollingEffect } from "@/hooks/usePollingEffect";
import { useSlotFormOptions } from "@/hooks/useSlotFormOptions";
import { useOperatorCustomerContext } from "@/hooks/useOperatorCustomerContext";
import { useSlotTimeline } from "@/hooks/useSlotTimeline";
import type { OperatorSlotQueueCategory, OperatorSlotQueueContext } from "@/types/open-slot-detail";
import { isSlotRecoveryTerminalStatus, slotStatusToRecoveryPipelineActiveStep } from "@/lib/slot-recovery-pipeline";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

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
  return "This opening is no longer active on the recovery path.";
}

export function OpenSlotDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const slotId = params?.id;
  const { slot, queueContext, availableActions, loading, error, reload } = useOpenSlotDetail(slotId);
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
    attempts: notificationAttempts,
    loading: notificationAttemptsLoading,
    error: notificationAttemptsError,
    reload: reloadNotificationAttempts,
  } = useNotificationAttempts(slotId);
  const claimId = slot?.winning_claim?.id;
  const winningCustomerId = slot?.winning_claim?.customer_id;
  const customerCtx = useOperatorCustomerContext(winningCustomerId);
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
      reloadNotificationAttempts(),
      options.reload(),
      customerCtx.reload(),
    ]);
    setRefreshedAt(new Date());
  }, [reload, reloadTimeline, reloadNotificationLogs, reloadNotificationAttempts, options.reload, customerCtx.reload]);

  const silentRefresh = useCallback(async () => {
    await Promise.all([
      reload({ silent: true }),
      reloadTimeline({ silent: true }),
      reloadNotificationLogs({ silent: true }),
      reloadNotificationAttempts({ silent: true }),
      customerCtx.reload(),
    ]);
    setRefreshedAt(new Date());
  }, [reload, reloadTimeline, reloadNotificationLogs, reloadNotificationAttempts, customerCtx.reload]);

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

  return (
    <main className="pf-page-slot-detail" style={{ padding: 0 }}>
      <OpenSlotDetailToolbar refreshedAt={refreshedAt} backHref={back.href} backLabel={back.label} sourceChip={sourceChip} />

      <OperatorPageTransition>
      {loading ? (
        <div style={{ marginTop: 16 }}>
          <OperatorLoadingState
            variant="section"
            skeleton="form"
            title="Loading opening…"
            description="Fetching case details, offers, and the latest recovery status."
          />
        </div>
      ) : null}
      {error ? (
        <div style={{ marginTop: 16 }}>
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

      {slot ? (
        <div className="pf-slot-detail-case-grid" style={{ marginTop: 18 }}>
          <div style={{ display: "grid", gap: 22, minWidth: 0 }}>
            {/* 1 — Case header + recovery path + actions */}
            <div
              style={{
                borderRadius: 22,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background:
                  "linear-gradient(165deg, rgba(255,255,255,0.05), rgba(255,122,24,0.014) 48%, rgba(10,9,7,0.94))",
                padding: "22px 22px 20px",
                boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
              }}
            >
              <SlotDetailIdentityHeader
                slot={slot}
                serviceLabel={serviceLabel}
                locationLabel={locationLabel}
                namesLoading={namesLoading}
              />
              <div style={{ marginTop: 14 }}>
                <p className="pf-kicker" style={{ margin: "0 0 8px" }}>
                  Recovery path
                </p>
                {isSlotRecoveryTerminalStatus(slot.status) ? (
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                    {terminalRecoveryCopy(slot.status)}
                  </p>
                ) : (
                  <RecoveryPipeline
                    activeStep={slotStatusToRecoveryPipelineActiveStep(slot.status)}
                    compact
                    animated
                    showFlowLabel={false}
                    interactive={false}
                  />
                )}
              </div>
              {queueChip ? (
                <div style={{ marginTop: 14 }}>
                  <OperatorStatusChip
                    kind={queueCategoryToStatusKind(queueContext?.current_category ?? null) ?? "pending"}
                    label={queueChip}
                    caps
                  />
                </div>
              ) : null}
              <div style={{ marginTop: 20 }}>
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
            </div>

            {/* 2 — Guidance */}
            <OperatorSlotReasonBanner queueContext={queueContext} />

            {/* 3 — Attention cues */}
            <SlotAttentionCues slot={slot} logs={notificationLogs} />

            {/* 4 — Case summary */}
            <OpenSlotDetailSection
              sectionId="pf-slot-scroll-appointment"
              eyebrow="Case"
              title="Appointment details"
              description="The time, provider, service, and location connected to this opening."
            >
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.09)",
                background: "linear-gradient(165deg, rgba(18,16,14,0.95), rgba(8,7,6,0.98))",
                padding: 18,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <SlotDetailFactsGrid
                slot={slot}
                serviceLabel={serviceLabel}
                locationLabel={locationLabel}
                namesLoading={namesLoading}
              />
            </div>
          </OpenSlotDetailSection>

          {slot.notes ? (
            <OpenSlotDetailSection eyebrow="Patient-facing" title="Opening notes" description="Shown where relevant in customer-facing flows.">
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.22)",
                  padding: 16,
                }}
              >
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--pf-text-primary)" }}>{slot.notes}</p>
              </div>
            </OpenSlotDetailSection>
          ) : null}

            {/* 5 — Offers / claims */}
            <OpenSlotDetailSection
            sectionId="pf-slot-scroll-workflow"
            eyebrow="Workflow"
            title="Customer request"
            description="Confirm once the clinic has added this appointment to the schedule."
          >
            <div style={{ display: "grid", gap: 16 }}>
              <OperatorSlotOffersSummary slot={slot} />
              <SlotOffersInspector slot={slot} />
            </div>
            </OpenSlotDetailSection>

            {/* 6 — Internal notes */}
            <div id="operator-slot-internal-note">
            <OpenSlotDetailSection
              eyebrow="Team memory"
              title="Internal notes & resolution"
              description="Staff-only — fast to update, auditable on the timeline."
            >
              <OperatorInternalNoteCard
                openSlotId={slot.id}
                initialNote={slot.internal_note}
                initialResolutionStatus={slot.resolution_status}
                initialUpdatedAt={slot.internal_note_updated_at}
                onSaved={() => void silentRefresh()}
              />
            </OpenSlotDetailSection>
            </div>

            {/* 7 — Timeline */}
            <OpenSlotDetailSection
              sectionId="pf-slot-scroll-timeline"
              eyebrow="History"
              title="Activity timeline"
              description="What changed, when, and why it matters."
            >
              {timelineLoading ? <p className="pf-muted-copy">Loading timeline…</p> : null}
              {timelineError ? <p style={{ color: "#f87171" }}>{timelineError}</p> : null}
              {!timelineLoading ? <SlotTimeline events={timelineEvents} /> : null}
            </OpenSlotDetailSection>

            {/* 8 — Notification attempt diagnostics */}
            <OpenSlotDetailSection
            eyebrow="Messages"
            title="Notification history"
            description="See which customer messages were sent and whether anything needs attention."
          >
              {notificationAttemptsLoading ? <p className="pf-muted-copy">Loading notification attempts…</p> : null}
              {notificationAttemptsError ? <p style={{ color: "#f87171" }}>{notificationAttemptsError}</p> : null}
              {!notificationAttemptsLoading && !notificationAttemptsError && notificationAttempts.length > 0 ? (
                <OpenSlotLogsPanel summaryLabel="Message delivery records">
                  <NotificationAttemptsPanel attempts={notificationAttempts} />
                </OpenSlotLogsPanel>
              ) : null}
              {!notificationAttemptsLoading && !notificationAttemptsError && notificationAttempts.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "rgba(245,247,250,0.45)" }}>
                  No notification attempts for this opening yet.
                </p>
              ) : null}
            </OpenSlotDetailSection>

            {/* 9 — Raw logs */}
            <div id="operator-slot-notification-logs">
            <OpenSlotDetailSection
              eyebrow="Messages"
              title="Detailed notification history"
              description="Expand for message status details and provider outcomes."
            >
              {notificationLogsLoading ? <p className="pf-muted-copy">Loading notification logs…</p> : null}
              {notificationLogsError ? <p style={{ color: "#f87171" }}>{notificationLogsError}</p> : null}
              {!notificationLogsLoading && !notificationLogsError && notificationLogs.length > 0 ? (
                <OpenSlotLogsPanel summaryLabel="Notification history details">
                  <NotificationLogsInspector logs={notificationLogs} />
                </OpenSlotLogsPanel>
              ) : null}
              {!notificationLogsLoading && !notificationLogsError && notificationLogs.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "rgba(245,247,250,0.45)" }}>No notification logs for this opening yet.</p>
              ) : null}
            </OpenSlotDetailSection>
            </div>
          </div>

          <aside className="pf-slot-detail-case-rail">
            {!isSlotRecoveryTerminalStatus(slot.status) ? (
              <div style={{ padding: "12px 14px", ...operatorSurfaceShell("quiet") }}>
                <p className="pf-kicker" style={{ margin: "0 0 8px" }}>
                  Recovery steps
                </p>
                <RecoveryPipeline
                  activeStep={slotStatusToRecoveryPipelineActiveStep(slot.status)}
                  compact
                  animated
                  showFlowLabel={false}
                  interactive
                  onStepSelect={scrollToRecoverySection}
                  style={{ background: "transparent", boxShadow: "none", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 8px" }}
                />
              </div>
            ) : null}
            <div style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
              <p className="pf-kicker" style={{ margin: "0 0 6px" }}>
                Last updated
              </p>
              <p className="pf-meta-row" style={{ margin: 0, fontSize: 13 }}>
                {refreshedAt
                  ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(refreshedAt)
                  : "—"}
              </p>
            </div>

            {queueContext?.reason_detail?.trim() ? (
              <div style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
                <p className="pf-kicker" style={{ margin: "0 0 8px" }}>
                  Match & queue
                </p>
                <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
                  {queueContext.reason_detail.length > 280
                    ? `${queueContext.reason_detail.slice(0, 280)}…`
                    : queueContext.reason_detail}
                </p>
              </div>
            ) : null}

            {winningCustomerId ? (
              <div style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
                <p className="pf-kicker" style={{ margin: "0 0 8px" }}>
                  Customer coverage
                </p>
                <OperatorCustomerContextSection
                  loading={customerCtx.loading}
                  error={customerCtx.error}
                  data={customerCtx.data}
                />
              </div>
            ) : null}

            {!notificationLogsLoading && notificationLogs.length > 0 ? (
              <div style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
                <p className="pf-kicker" style={{ margin: "0 0 8px" }}>
                  Delivery
                </p>
                <SlotDeliverySummary logs={notificationLogs} />
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
      </OperatorPageTransition>
    </main>
  );
}
