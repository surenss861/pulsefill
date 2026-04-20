import { runOperatorBulkAction } from "@/lib/operator-bulk-actions";
import type { BulkSlotActionResponse } from "@/types/bulk-actions";
import type { MorningRecoveryDigestSection } from "@/types/morning-recovery-digest";

/** Runs server-backed bulk actions for a digest section; review-only sections return null. */
export async function runDigestSectionAction(
  section: MorningRecoveryDigestSection,
): Promise<BulkSlotActionResponse | null> {
  if (section.action_type === "bulk_retry_offers") {
    return runOperatorBulkAction({
      action: "retry_offers",
      openSlotIds: section.slot_ids,
    });
  }
  return null;
}
