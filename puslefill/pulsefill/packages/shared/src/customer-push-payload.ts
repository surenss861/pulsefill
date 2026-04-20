/** Canonical vocabulary for new push generation (no aliases). */
export type CustomerPushEventType =
  | "offer_received"
  | "offer_expiring_soon"
  | "claim_submitted"
  | "claim_pending_confirmation"
  | "booking_confirmed"
  | "claim_unavailable"
  | "offer_expired"
  | "missed_opportunity"
  | "standby_status_reminder"
  | "standby_setup_suggestion";

export type CustomerPushPayloadArgs = {
  type: CustomerPushEventType;
  title: string;
  body: string;
  offerId?: string;
  claimId?: string;
  openSlotId?: string;
};

/** APNs root payload: alert in `aps`, routing in nested `data` (snake_case). */
export function buildCustomerPushPayload(args: CustomerPushPayloadArgs) {
  return {
    aps: {
      alert: {
        title: args.title,
        body: args.body,
      },
    },
    data: {
      type: args.type,
      ...(args.offerId ? { offer_id: args.offerId } : {}),
      ...(args.claimId ? { claim_id: args.claimId } : {}),
      ...(args.openSlotId ? { open_slot_id: args.openSlotId } : {}),
    },
  } as const;
}
