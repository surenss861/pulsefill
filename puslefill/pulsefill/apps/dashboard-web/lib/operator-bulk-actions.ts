import { apiFetch } from "@/lib/api";
import type { BulkSlotActionKind, BulkSlotActionResponse } from "@/types/bulk-actions";

export async function runOperatorBulkAction(args: {
  action: BulkSlotActionKind;
  openSlotIds: string[];
}): Promise<BulkSlotActionResponse> {
  return apiFetch<BulkSlotActionResponse>("/v1/open-slots/bulk-action", {
    method: "POST",
    body: JSON.stringify({
      action: args.action,
      open_slot_ids: args.openSlotIds,
    }),
  });
}
