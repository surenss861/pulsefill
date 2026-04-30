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
  return map[c] ?? c;
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

  return (
    <main style={{ padding: 0, maxWidth: 920 }}>
      <OpenSlotDetailToolbar refreshedAt={refreshedAt} backHref={back.href} backLabel={back.label} sourceChip={sourceChip} />

      {loading ? <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading opening…</p> : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {slot && !loading ? (
        <SlotRecentActivityBar
          slot={slot}
          timelineEvents={timelineEvents}
          notificationLogs={notificationLogs}
          refreshedAt={refreshedAt}
        />
      ) : null}

      {slot ? (
        <div style={{ display: "grid", gap: 22, marginTop: 18 }}>
          {/* 1 — Execution hero */}
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
            {queueChip ? (
              <div style={{ marginTop: 14 }}>
                <span
                  style={{
                    display: "inline-flex",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 650,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    background: "rgba(255, 122, 24, 0.07)",
                    color: "rgba(255, 186, 120, 0.92)",
                  }}
                >
                  {queueChip}
                </span>
              </div>
            ) : null}
            <div style={{ marginTop: 20 }}>
              <OperatorSlotActionBar
                openSlotId={slot.id}
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

          {/* 4 — Opening context */}
          <OpenSlotDetailSection
            eyebrow="Record"
            title="Appointment details"
            description="The time, provider, service, and location connected to this opening."
          >
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(10, 15, 26, 0.55)",
                padding: 18,
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

          {/* 5 — Customer */}
          {winningCustomerId ? (
            <OpenSlotDetailSection
              eyebrow="Recovery"
              title="Customer context"
              description="Who this recovery targets and how reachable they are."
            >
              <OperatorCustomerContextSection
                loading={customerCtx.loading}
                error={customerCtx.error}
                data={customerCtx.data}
              />
            </OpenSlotDetailSection>
          ) : null}

          {/* 6 — Delivery observability */}
          {!notificationLogsLoading && notificationLogs.length > 0 ? (
            <OpenSlotDetailSection
              eyebrow="Observability"
              title="Delivery summary"
              description="Whether outreach actually landed — and what broke if it did not."
            >
              <SlotDeliverySummary logs={notificationLogs} />
            </OpenSlotDetailSection>
          ) : null}

          {/* 7 — Offers / claims */}
          <OpenSlotDetailSection
            eyebrow="Workflow"
            title="Customer request"
            description="Confirm once the clinic has added this appointment to the schedule."
          >
            <div style={{ display: "grid", gap: 16 }}>
              <OperatorSlotOffersSummary slot={slot} />
              <SlotOffersInspector slot={slot} />
            </div>
          </OpenSlotDetailSection>

          {/* 8 — Internal notes */}
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

          {/* 9 — Timeline */}
          <OpenSlotDetailSection eyebrow="History" title="Activity timeline" description="What changed, when, and why it matters.">
            {timelineLoading ? <p style={{ color: "var(--muted)" }}>Loading timeline…</p> : null}
            {timelineError ? <p style={{ color: "#f87171" }}>{timelineError}</p> : null}
            {!timelineLoading ? <SlotTimeline events={timelineEvents} /> : null}
          </OpenSlotDetailSection>

          {/* 10 — Notification attempt diagnostics */}
          <OpenSlotDetailSection
            eyebrow="Messages"
            title="Notification history"
            description="See which customer messages were sent and whether anything needs attention."
          >
            {notificationAttemptsLoading ? <p style={{ color: "var(--muted)" }}>Loading notification attempts…</p> : null}
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

          {/* 11 — Raw logs */}
          <div id="operator-slot-notification-logs">
            <OpenSlotDetailSection
              eyebrow="Messages"
              title="Detailed notification history"
              description="Expand for message status details and provider outcomes."
            >
              {notificationLogsLoading ? <p style={{ color: "var(--muted)" }}>Loading notification logs…</p> : null}
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
      ) : null}
    </main>
  );
}
