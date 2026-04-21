import type { ActionQueueKind } from "@/types/action-queue";

/** Short labels for category chips (keep aligned with product copy spec). */
export const QUEUE_KIND_LABELS: Record<ActionQueueKind, string> = {
  awaiting_confirmation: "Awaiting confirmation",
  delivery_failed: "Delivery failed",
  retry_recommended: "Retry recommended",
  no_matches: "No matches",
  offered_active: "Offers active",
  expired_unfilled: "Expired unfilled",
  confirmed_booking: "Recovered",
};

/** Canonical one-line reason copy per queue kind (server-aligned narratives). */
export const ACTION_QUEUE_REASON_COPY: Record<ActionQueueKind, string> = {
  awaiting_confirmation:
    "A patient claimed this slot and staff confirmation is still needed.",
  delivery_failed: "Offer delivery did not complete successfully. Review before retrying.",
  retry_recommended: "A previous offer batch exists and this slot may still be recoverable.",
  no_matches: "No eligible standby patients were found for this opening.",
  offered_active: "A live offer batch is still in flight. Review before retrying.",
  expired_unfilled: "This slot expired without a confirmed recovery.",
  confirmed_booking: "This slot was recently recovered and confirmed.",
};

export function reasonCopyForQueueKind(kind: ActionQueueKind): string {
  return ACTION_QUEUE_REASON_COPY[kind];
}
