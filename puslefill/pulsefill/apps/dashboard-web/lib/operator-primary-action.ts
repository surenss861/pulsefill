import type { ActionQueueItem } from "@/types/action-queue";
import type { OperatorSlotsListItem } from "@/types/operator-slots-list";

export type DerivedOperatorPrimaryAction =
  | { kind: "send_offers"; label: "Send offers" }
  | { kind: "retry_offers"; label: "Retry" }
  | { kind: "confirm_booking"; label: "Confirm"; claimId: string }
  | null;

/** Slots list + shared status/claim rules. */
export function deriveOperatorPrimaryAction(input: {
  status?: string | null;
  winningClaimId?: string | null;
}): DerivedOperatorPrimaryAction {
  const status = (input.status || "").toLowerCase();

  if (status === "open") {
    return { kind: "send_offers", label: "Send offers" };
  }

  if (status === "offered") {
    return { kind: "retry_offers", label: "Retry" };
  }

  if (status === "claimed" && input.winningClaimId) {
    return {
      kind: "confirm_booking",
      label: "Confirm",
      claimId: input.winningClaimId,
    };
  }

  return null;
}

export function deriveOperatorPrimaryActionFromSlot(slot: OperatorSlotsListItem): DerivedOperatorPrimaryAction {
  return deriveOperatorPrimaryAction({
    status: slot.status,
    winningClaimId: slot.winning_claim?.id ?? null,
  });
}

/**
 * Queue rows: respect API action ordering (e.g. inspect_logs stays non-inline).
 * Uses slot_status + claim_id for confirm / send / retry when appropriate.
 */
export function deriveQueueInlinePrimaryAction(item: ActionQueueItem): DerivedOperatorPrimaryAction {
  const first = item.actions[0];
  if (first === "inspect_logs") {
    return null;
  }
  if (first === "view_slot") {
    return null;
  }

  const status = (item.slot_status || "").toLowerCase();

  if (first === "confirm_booking") {
    if (status === "claimed" && item.claim_id) {
      return { kind: "confirm_booking", label: "Confirm", claimId: item.claim_id };
    }
    return null;
  }

  if (first === "retry_offers") {
    if (status === "open") {
      return { kind: "send_offers", label: "Send offers" };
    }
    if (status === "offered") {
      return { kind: "retry_offers", label: "Retry" };
    }
    return null;
  }

  return null;
}
