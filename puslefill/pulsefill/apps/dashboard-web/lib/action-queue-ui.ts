import { QUEUE_KIND_LABELS } from "@/lib/action-queue-copy";
import type { ActionQueueAction, ActionQueueKind } from "@/types/action-queue";

export function kindLabel(kind: ActionQueueKind): string {
  return QUEUE_KIND_LABELS[kind] ?? kind;
}

export function actionButtonLabel(a: ActionQueueAction): string {
  const map: Record<ActionQueueAction, string> = {
    confirm_booking: "Confirm booking",
    open_slot: "Open detail",
    inspect_logs: "Inspect logs",
    retry_offers: "Retry offers",
    view_slot: "Open detail",
  };
  return map[a];
}
