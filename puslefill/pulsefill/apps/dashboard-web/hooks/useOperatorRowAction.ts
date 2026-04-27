"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { emitOperatorRefreshEvent } from "@/lib/operator-refresh-events";
import { runOperatorInlineAction, type OperatorInlineActionKind } from "@/lib/operator-inline-actions";

export function useOperatorRowAction(onSuccess?: () => Promise<void> | void) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function run(args: {
    rowId: string;
    kind: OperatorInlineActionKind;
    openSlotId: string;
    claimId?: string | null;
    successTitle: string;
  }) {
    const { rowId, successTitle, ...rest } = args;

    try {
      setBusyId(rowId);
      const res = (await runOperatorInlineAction(rest)) as {
        message?: string;
        result?: "offers_sent" | "offers_retried" | "no_matches";
      } | null;
      const toastTitle =
        typeof res?.message === "string" && res.message.trim() ? res.message : successTitle;
      const sendOrRetry = rest.kind === "send_offers" || rest.kind === "retry_offers";
      const noStandby = res?.result === "no_matches";
      const useInfoTone = Boolean(
        sendOrRetry &&
          (noStandby ||
            (typeof res?.message === "string" &&
              (res.message.includes("No matching") || res.message.includes("No new offers")))),
      );
      showToast({ title: toastTitle, tone: useInfoTone ? "info" : "success" });
      emitOperatorRefreshEvent("slot:updated", { slotId: rest.openSlotId, action: rest.kind });
      await onSuccess?.();
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Action failed",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return {
    busyId,
    run,
  };
}
