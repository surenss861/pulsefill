"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationLogsInspector } from "@/components/slots/notification-logs-inspector";
import { SlotDeliverySummary } from "@/components/slots/slot-delivery-summary";
import { OperatorInternalNoteCard } from "@/components/slots/operator-internal-note-card";
import { SlotAttentionCues } from "@/components/slots/slot-attention-cues";
import { SlotDetailHero } from "@/components/slots/slot-detail-hero";
import { SlotRecentActivityBar } from "@/components/slots/slot-recent-activity-bar";
import { OperatorSlotActionBar } from "@/components/slots/operator-slot-action-bar";
import { OperatorSlotOffersSummary } from "@/components/slots/operator-slot-offers-summary";
import { OperatorSlotReasonBanner } from "@/components/slots/operator-slot-reason-banner";
import { SlotOffersInspector } from "@/components/slots/slot-offers-inspector";
import { SlotTimeline } from "@/components/slots/slot-timeline";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { SlotRowShell } from "@/components/ui/slot-row-shell";
import { useNotificationLogs } from "@/hooks/useNotificationLogs";
import { useOpenSlotDetail } from "@/hooks/useOpenSlotDetail";
import { useOpenSlotRealtime } from "@/hooks/useOpenSlotRealtime";
import { usePollingEffect } from "@/hooks/usePollingEffect";
import { useSlotFormOptions } from "@/hooks/useSlotFormOptions";
import { OperatorCustomerContextSection } from "@/components/customers/operator-customer-context-section";
import { useOperatorCustomerContext } from "@/hooks/useOperatorCustomerContext";
import { useSlotTimeline } from "@/hooks/useSlotTimeline";

export default function OpenSlotDetailPage() {
  const params = useParams<{ id: string }>();
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
    await Promise.all([reload(), reloadTimeline(), reloadNotificationLogs(), options.reload(), customerCtx.reload()]);
    setRefreshedAt(new Date());
  }, [reload, reloadTimeline, reloadNotificationLogs, options.reload, customerCtx.reload]);

  const silentRefresh = useCallback(async () => {
    await Promise.all([
      reload({ silent: true }),
      reloadTimeline({ silent: true }),
      reloadNotificationLogs({ silent: true }),
      customerCtx.reload(),
    ]);
    setRefreshedAt(new Date());
  }, [reload, reloadTimeline, reloadNotificationLogs, customerCtx.reload]);

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

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p style={{ marginTop: 0 }}>
          <Link href="/open-slots" style={{ fontSize: 14 }}>
            ← Open slots
          </Link>
        </p>
        <RefreshIndicator updatedAt={refreshedAt} />
      </div>

      {loading ? <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading slot…</p> : null}
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
        <div style={{ display: "grid", gap: 20, marginTop: 16 }}>
          <OperatorSlotReasonBanner queueContext={queueContext} />

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

          <SlotAttentionCues slot={slot} logs={notificationLogs} />

          <div id="operator-slot-internal-note">
            <OperatorInternalNoteCard
              openSlotId={slot.id}
              initialNote={slot.internal_note}
              initialResolutionStatus={slot.resolution_status}
              initialUpdatedAt={slot.internal_note_updated_at}
              onSaved={() => void silentRefresh()}
            />
          </div>

          {winningCustomerId ? (
            <OperatorCustomerContextSection
              loading={customerCtx.loading}
              error={customerCtx.error}
              data={customerCtx.data}
            />
          ) : null}

          <SlotRowShell status={slot.status}>
            <SlotDetailHero
              slot={slot}
              serviceLabel={serviceLabel}
              locationLabel={locationLabel}
              namesLoading={namesLoading}
            />

            {slot.notes ? (
              <div
                style={{
                  marginTop: 20,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.2)",
                  padding: 16,
                }}
              >
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>Notes</p>
                <p style={{ margin: "8px 0 0", fontSize: 14 }}>{slot.notes}</p>
              </div>
            ) : null}
          </SlotRowShell>

          <OperatorSlotOffersSummary slot={slot} />

          <SlotOffersInspector slot={slot} />

          {timelineLoading ? <p style={{ color: "var(--muted)" }}>Loading timeline…</p> : null}
          {timelineError ? <p style={{ color: "#f87171" }}>{timelineError}</p> : null}
          {!timelineLoading ? <SlotTimeline events={timelineEvents} /> : null}

          {notificationLogsLoading ? <p style={{ color: "var(--muted)" }}>Loading notification logs…</p> : null}
          {notificationLogsError ? <p style={{ color: "#f87171" }}>{notificationLogsError}</p> : null}
          {!notificationLogsLoading && notificationLogs.length > 0 ? <SlotDeliverySummary logs={notificationLogs} /> : null}
          {!notificationLogsLoading ? (
            <div id="operator-slot-notification-logs">
              <NotificationLogsInspector logs={notificationLogs} />
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
