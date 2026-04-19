import type { ActionQueueAction, ActionQueueKind } from "@/types/action-queue";

export function kindLabel(kind: ActionQueueKind): string {
  const map: Record<ActionQueueKind, string> = {
    awaiting_confirmation: "Awaiting confirmation",
    delivery_failed: "Delivery failed",
    retry_recommended: "Retry suggested",
    no_matches: "No matches",
    offered_active: "Offers active",
    expired_unfilled: "Expired",
    confirmed_booking: "Booked",
  };
  return map[kind] ?? kind;
}

export function actionButtonLabel(a: ActionQueueAction): string {
  const map: Record<ActionQueueAction, string> = {
    confirm_booking: "Confirm booking",
    open_slot: "Open slot",
    inspect_logs: "Inspect logs",
    retry_offers: "Retry offers",
    view_slot: "View slot",
  };
  return map[a];
}
