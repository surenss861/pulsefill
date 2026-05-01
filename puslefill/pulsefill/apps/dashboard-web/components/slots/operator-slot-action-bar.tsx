"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ConfirmBookingButton } from "@/components/claims/confirm-booking-button";
import { RetryOffersButton } from "@/components/slots/retry-offers-button";
import { OperatorActionPanel } from "@/components/operator/operator-action-panel";
import { useToast } from "@/components/ui/toast-provider";
import { operatorActionMessageForCode } from "@/lib/operator-action-errors";
import { emitOperatorRefreshEvent, type OperatorRefreshAction } from "@/lib/operator-refresh-events";
import { slotNextActionPresentation } from "@/lib/operator-slot-next-action-panel";
import { isSlotRecoveryTerminalStatus } from "@/lib/slot-recovery-pipeline";
import { pressableHandlers, pressablePrimary, pressableSecondary } from "@/lib/pressable";
import type { OperatorSlotAvailableAction, OperatorSlotQueueCategory } from "@/types/open-slot-detail";

const ACTION_ORDER: OperatorSlotAvailableAction[] = [
  "confirm_booking",
  "retry_offers",
  "send_offers",
  "expire_slot",
  "cancel_slot",
  "add_note",
  "inspect_notification_logs",
];

const ACTION_LABELS: Record<OperatorSlotAvailableAction, string> = {
  confirm_booking: "Confirm booking",
  retry_offers: "Retry offers",
  send_offers: "Send offers",
  expire_slot: "Expire opening",
  cancel_slot: "Cancel opening",
  add_note: "Add note",
  inspect_notification_logs: "Inspect delivery logs",
};

function isUtility(a: OperatorSlotAvailableAction) {
  return a === "add_note" || a === "inspect_notification_logs";
}

type Props = {
  openSlotId: string;
  slotStatus: string;
  queueCategory: OperatorSlotQueueCategory | null;
  claimId: string | null | undefined;
  availableActions: OperatorSlotAvailableAction[];
  onMutationsDone: () => void | Promise<void>;
  onAddNote: () => void;
  onInspectLogs: () => void;
};

export function OperatorSlotActionBar({
  openSlotId,
  slotStatus,
  queueCategory,
  claimId,
  availableActions,
  onMutationsDone,
  onAddNote,
  onInspectLogs,
}: Props) {
  const { showToast } = useToast();
  const [expireLoading, setExpireLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const presentation = useMemo(
    () =>
      slotNextActionPresentation({
        slotStatus,
        queueCategory,
        availableActions,
      }),
    [slotStatus, queueCategory, availableActions],
  );

  const sorted = [...availableActions].sort(
    (a, b) => ACTION_ORDER.indexOf(a) - ACTION_ORDER.indexOf(b),
  );
  const mutating = sorted.filter((a) => !isUtility(a));
  const utilities = sorted.filter(isUtility);
  const primary = mutating.slice(0, 2);
  const secondary = [...mutating.slice(2), ...utilities];

  async function runConflictAware<T>(fn: () => Promise<T>, refreshAction?: OperatorRefreshAction): Promise<void> {
    try {
      await fn();
      if (refreshAction) {
        emitOperatorRefreshEvent("slot:updated", { slotId: openSlotId, action: refreshAction });
      }
      await onMutationsDone();
    } catch (err) {
      const code = err instanceof Error ? (err as { code?: string }).code : undefined;
      if (code === "operator_action_not_allowed") {
        showToast({
          title: operatorActionMessageForCode(code, "This opening changed."),
          tone: "info",
        });
        await onMutationsDone();
        return;
      }
      throw err;
    }
  }

  async function handleExpire() {
    if (!window.confirm("Expire this opening? It can no longer receive offers after this.")) return;
    try {
      setExpireLoading(true);
      await runConflictAware(
        () =>
          apiFetch(`/v1/open-slots/${openSlotId}/expire`, {
            method: "POST",
            body: JSON.stringify({}),
          }),
        "expire_slot",
      );
      showToast({ title: "Opening expired.", tone: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not expire opening.";
      showToast({ title: msg, tone: "error" });
    } finally {
      setExpireLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this opening for patients? This cannot be undone from the dashboard.")) return;
    try {
      setCancelLoading(true);
      await runConflictAware(
        () =>
          apiFetch(`/v1/open-slots/${openSlotId}/cancel`, {
            method: "POST",
            body: JSON.stringify({}),
          }),
        "cancel_slot",
      );
      showToast({ title: "Opening cancelled.", tone: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not cancel opening.";
      showToast({ title: msg, tone: "error" });
    } finally {
      setCancelLoading(false);
    }
  }

  function renderAction(action: OperatorSlotAvailableAction, row: "primary" | "secondary") {
    const isPrimary = row === "primary";
    const baseBtn = isPrimary ? pressablePrimary : pressableSecondary;
    const loading = expireLoading || cancelLoading;

    if (action === "confirm_booking") {
      if (!claimId) return null;
      return (
        <ConfirmBookingButton
          key={action}
          openSlotId={openSlotId}
          claimId={claimId}
          onConfirmed={() => void onMutationsDone()}
          onConflict={() => void onMutationsDone()}
        />
      );
    }

    if (action === "send_offers" || action === "retry_offers") {
      return (
        <RetryOffersButton
          key={`${action}-${openSlotId}`}
          openSlotId={openSlotId}
          refreshAction={action === "send_offers" ? "send_offers" : "retry_offers"}
          onDone={() => void onMutationsDone()}
          onConflict={() => void onMutationsDone()}
          emphasis={action === "send_offers" ? "primary" : "secondary"}
          label={ACTION_LABELS[action]}
        />
      );
    }

    if (action === "expire_slot") {
      return (
        <button
          key={action}
          type="button"
          disabled={loading || expireLoading}
          onClick={() => void handleExpire()}
          style={{
            ...baseBtn,
            opacity: expireLoading ? 0.65 : 1,
            cursor: expireLoading ? "not-allowed" : "pointer",
          }}
          {...pressableHandlers(loading || expireLoading)}
        >
          {expireLoading ? "Expiring…" : ACTION_LABELS[action]}
        </button>
      );
    }

    if (action === "cancel_slot") {
      return (
        <button
          key={action}
          type="button"
          disabled={loading || cancelLoading}
          onClick={() => void handleCancel()}
          style={{
            ...baseBtn,
            opacity: cancelLoading ? 0.65 : 1,
            cursor: cancelLoading ? "not-allowed" : "pointer",
          }}
          {...pressableHandlers(loading || cancelLoading)}
        >
          {cancelLoading ? "Cancelling…" : ACTION_LABELS[action]}
        </button>
      );
    }

    if (action === "add_note") {
      return (
        <button
          key={action}
          type="button"
          onClick={onAddNote}
          style={{
            ...baseBtn,
            cursor: "pointer",
          }}
          {...pressableHandlers(false)}
        >
          {ACTION_LABELS[action]}
        </button>
      );
    }

    if (action === "inspect_notification_logs") {
      return (
        <button
          key={action}
          type="button"
          onClick={onInspectLogs}
          style={{
            ...baseBtn,
            cursor: "pointer",
          }}
          {...pressableHandlers(false)}
        >
          {ACTION_LABELS[action]}
        </button>
      );
    }

    return null;
  }

  const statusLower = slotStatus.toLowerCase();
  const showQuietTerminal =
    sorted.length === 0 && (statusLower === "booked" || isSlotRecoveryTerminalStatus(slotStatus));

  if (sorted.length === 0 && !showQuietTerminal) return null;

  const primaryRow =
    primary.length > 0 ? (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        {primary.map((a) => renderAction(a, "primary"))}
      </div>
    ) : null;
  const secondaryRow =
    secondary.length > 0 ? (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start" }}>
        {secondary.map((a) => renderAction(a, "secondary"))}
      </div>
    ) : null;

  const combinedActions =
    primaryRow || secondaryRow ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {primaryRow}
        {secondaryRow}
      </div>
    ) : null;

  return (
    <OperatorActionPanel
      eyebrow={presentation.eyebrow ?? undefined}
      title={presentation.title}
      description={presentation.description}
      priority={presentation.priority}
      primaryAction={combinedActions ?? undefined}
    />
  );
}
