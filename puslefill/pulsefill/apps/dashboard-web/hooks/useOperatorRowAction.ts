"use client";

import { useState } from "react";
import { runOperatorInlineAction, type OperatorInlineActionKind } from "@/lib/operator-inline-actions";
import { useToast } from "@/components/ui/toast-provider";

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
      const res = (await runOperatorInlineAction(rest)) as { message?: string } | undefined;
      const toastTitle =
        typeof res?.message === "string" && res.message.trim() ? res.message : successTitle;
      showToast({ title: toastTitle, tone: "success" });
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
