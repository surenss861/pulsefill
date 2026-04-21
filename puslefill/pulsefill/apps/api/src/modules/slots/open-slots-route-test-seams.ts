/**
 * Test-only hooks for route-layer success paths (`PULSEFILL_API_TEST=1`).
 * When set, handlers skip RPC / DB mutation side effects after real guards pass.
 * Always clear delegates in test `afterEach` (see `resetOpenSlotsRouteMutationTestDelegates`).
 */

export type ConfirmOpenSlotMutationTestDelegateArgs = {
  openSlotId: string;
  claimId: string;
  businessId: string;
  staffId: string;
  authUserId: string;
};

export type ConfirmOpenSlotMutationTestDelegate = (
  args: ConfirmOpenSlotMutationTestDelegateArgs,
) => Promise<void>;

export type SendOffersMutationTestDelegateArgs = {
  openSlotId: string;
  businessId: string;
  staffId: string;
  authUserId: string;
  /** `open_slots.status` before mutation (e.g. `open` vs `offered`). */
  previousStatus: string;
};

/** Fields passed through to `sendSendOffersSuccess` (excluding `ok` and `open_slot_id`). */
export type SendOffersMutationTestDelegateResult = {
  result: "offers_sent" | "offers_retried" | "no_matches";
  matched: number;
  offer_ids: string[];
  message: string;
  notification_queue?: { queued: boolean; count: number };
};

export type SendOffersMutationTestDelegate = (
  args: SendOffersMutationTestDelegateArgs,
) => Promise<SendOffersMutationTestDelegateResult>;

let confirmOpenSlotMutationTestDelegate: ConfirmOpenSlotMutationTestDelegate | null = null;
let sendOffersMutationTestDelegate: SendOffersMutationTestDelegate | null = null;

export function getConfirmOpenSlotMutationTestDelegate(): ConfirmOpenSlotMutationTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? confirmOpenSlotMutationTestDelegate : null;
}

export function getSendOffersMutationTestDelegate(): SendOffersMutationTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? sendOffersMutationTestDelegate : null;
}

export function setConfirmOpenSlotMutationTestDelegate(delegate: ConfirmOpenSlotMutationTestDelegate | null) {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    if (delegate != null) {
      throw new Error("setConfirmOpenSlotMutationTestDelegate is only valid when PULSEFILL_API_TEST=1");
    }
    return;
  }
  confirmOpenSlotMutationTestDelegate = delegate;
}

export function setSendOffersMutationTestDelegate(delegate: SendOffersMutationTestDelegate | null) {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    if (delegate != null) {
      throw new Error("setSendOffersMutationTestDelegate is only valid when PULSEFILL_API_TEST=1");
    }
    return;
  }
  sendOffersMutationTestDelegate = delegate;
}

export function resetOpenSlotsRouteMutationTestDelegates() {
  if (process.env.PULSEFILL_API_TEST === "1") {
    confirmOpenSlotMutationTestDelegate = null;
    sendOffersMutationTestDelegate = null;
  }
}
