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
  offer_customer_ids?: Array<{ offer_id: string; customer_id: string }>;
  message: string;
  notification_queue?: { queued: boolean; count: number };
};

export type SendOffersMutationTestDelegate = (
  args: SendOffersMutationTestDelegateArgs,
) => Promise<SendOffersMutationTestDelegateResult>;

export type ExpireOpenSlotMutationTestDelegateArgs = {
  openSlotId: string;
  businessId: string;
  staffId: string;
  authUserId: string;
};

export type ExpireOpenSlotMutationTestDelegate = (
  args: ExpireOpenSlotMutationTestDelegateArgs,
) => Promise<{ ok: boolean; error?: string }>;

export type CancelOpenSlotMutationTestDelegateArgs = {
  openSlotId: string;
  businessId: string;
  staffId: string;
  authUserId: string;
};

export type CancelOpenSlotMutationTestDelegate = (
  args: CancelOpenSlotMutationTestDelegateArgs,
) => Promise<{ ok: boolean; error?: string }>;

export type ClaimOpenSlotRpcTestDelegateArgs = {
  openSlotId: string;
  customerId: string;
  deposit_payment_intent_id: string | null;
};

export type ClaimOpenSlotRpcTestDelegateResult = {
  ok?: boolean;
  error?: string;
  claim_id?: string;
};

export type ClaimOpenSlotRpcTestDelegate = (
  args: ClaimOpenSlotRpcTestDelegateArgs,
) => Promise<ClaimOpenSlotRpcTestDelegateResult>;

export type ConfirmBookedClaimLookupTestDelegateArgs = {
  claimId: string;
  openSlotId: string;
};

export type ConfirmBookedClaimLookupRow = {
  id: string;
  status: string;
  open_slot_id: string;
};

export type ConfirmBookedClaimLookupTestDelegate = (
  args: ConfirmBookedClaimLookupTestDelegateArgs,
) => Promise<ConfirmBookedClaimLookupRow | null>;

let confirmOpenSlotMutationTestDelegate: ConfirmOpenSlotMutationTestDelegate | null = null;
let sendOffersMutationTestDelegate: SendOffersMutationTestDelegate | null = null;
let expireOpenSlotMutationTestDelegate: ExpireOpenSlotMutationTestDelegate | null = null;
let cancelOpenSlotMutationTestDelegate: CancelOpenSlotMutationTestDelegate | null = null;
let claimOpenSlotRpcTestDelegate: ClaimOpenSlotRpcTestDelegate | null = null;
let confirmBookedClaimLookupTestDelegate: ConfirmBookedClaimLookupTestDelegate | null = null;

export function getConfirmOpenSlotMutationTestDelegate(): ConfirmOpenSlotMutationTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? confirmOpenSlotMutationTestDelegate : null;
}

export function getSendOffersMutationTestDelegate(): SendOffersMutationTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? sendOffersMutationTestDelegate : null;
}

export function getExpireOpenSlotMutationTestDelegate(): ExpireOpenSlotMutationTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? expireOpenSlotMutationTestDelegate : null;
}

export function getCancelOpenSlotMutationTestDelegate(): CancelOpenSlotMutationTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? cancelOpenSlotMutationTestDelegate : null;
}

export function getClaimOpenSlotRpcTestDelegate(): ClaimOpenSlotRpcTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? claimOpenSlotRpcTestDelegate : null;
}

export function getConfirmBookedClaimLookupTestDelegate(): ConfirmBookedClaimLookupTestDelegate | null {
  return process.env.PULSEFILL_API_TEST === "1" ? confirmBookedClaimLookupTestDelegate : null;
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

export function setExpireOpenSlotMutationTestDelegate(delegate: ExpireOpenSlotMutationTestDelegate | null) {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    if (delegate != null) {
      throw new Error("setExpireOpenSlotMutationTestDelegate is only valid when PULSEFILL_API_TEST=1");
    }
    return;
  }
  expireOpenSlotMutationTestDelegate = delegate;
}

export function setCancelOpenSlotMutationTestDelegate(delegate: CancelOpenSlotMutationTestDelegate | null) {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    if (delegate != null) {
      throw new Error("setCancelOpenSlotMutationTestDelegate is only valid when PULSEFILL_API_TEST=1");
    }
    return;
  }
  cancelOpenSlotMutationTestDelegate = delegate;
}

export function setClaimOpenSlotRpcTestDelegate(delegate: ClaimOpenSlotRpcTestDelegate | null) {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    if (delegate != null) {
      throw new Error("setClaimOpenSlotRpcTestDelegate is only valid when PULSEFILL_API_TEST=1");
    }
    return;
  }
  claimOpenSlotRpcTestDelegate = delegate;
}

export function setConfirmBookedClaimLookupTestDelegate(delegate: ConfirmBookedClaimLookupTestDelegate | null) {
  if (process.env.PULSEFILL_API_TEST !== "1") {
    if (delegate != null) {
      throw new Error("setConfirmBookedClaimLookupTestDelegate is only valid when PULSEFILL_API_TEST=1");
    }
    return;
  }
  confirmBookedClaimLookupTestDelegate = delegate;
}

export function resetOpenSlotsRouteMutationTestDelegates() {
  if (process.env.PULSEFILL_API_TEST === "1") {
    confirmOpenSlotMutationTestDelegate = null;
    sendOffersMutationTestDelegate = null;
    expireOpenSlotMutationTestDelegate = null;
    cancelOpenSlotMutationTestDelegate = null;
    claimOpenSlotRpcTestDelegate = null;
    confirmBookedClaimLookupTestDelegate = null;
  }
}
