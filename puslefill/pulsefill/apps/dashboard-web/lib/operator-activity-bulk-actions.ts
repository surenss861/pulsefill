import { runOperatorBulkAction } from "@/lib/operator-bulk-actions";

/** Bulk retry offers for the given open slot ids (reuses POST /v1/open-slots/bulk-action). */
export async function retrySelectedActivitySlots(openSlotIds: string[]) {
  const ids = [...new Set(openSlotIds.filter(Boolean))];
  if (ids.length === 0) {
    return null;
  }
  return runOperatorBulkAction({ action: "retry_offers", openSlotIds: ids });
}

export function openSlotsUrlForActivitySelection(openSlotIds: string[]): string {
  const ids = [...new Set(openSlotIds.filter(Boolean))];
  if (ids.length === 0) return "/open-slots";
  const q = new URLSearchParams();
  q.set("digest_slot_ids", ids.join(","));
  return `/open-slots?${q.toString()}`;
}
