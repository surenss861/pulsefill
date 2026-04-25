import type { OperatorActivityItem } from "@/types/operator-activity-feed";

export type OperatorActivitySummary = {
  recovered: number;
  deliveryFailures: number;
  noteUpdates: number;
  pendingConfirmations: number;
  expired: number;
};

/** Top scan counts from the full feed (not filter-limited). */
export function summarizeOperatorActivityFeed(items: OperatorActivityItem[]): OperatorActivitySummary {
  let recovered = 0;
  let deliveryFailures = 0;
  let noteUpdates = 0;
  let pendingConfirmations = 0;
  let expired = 0;

  for (const i of items) {
    if (i.kind === "booking_confirmed") recovered += 1;
    if (i.kind === "delivery_failed") deliveryFailures += 1;
    if (i.kind === "internal_note_updated") noteUpdates += 1;
    if (i.kind === "claim_received") pendingConfirmations += 1;
    if (i.kind === "slot_expired") expired += 1;
  }

  return { recovered, deliveryFailures, noteUpdates, pendingConfirmations, expired };
}
