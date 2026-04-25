import {
  decideCustomerBookingConfirmedPush,
  decideCustomerLostOpportunityPush,
  decideCustomerOfferSentPush,
  decideCustomerStandbySetupSuggestionPush,
  decideCustomerStandbyStatusReminderPush,
  decideOperatorClaimNeedsConfirmationPush,
} from "./push-decision.js";
import type { PushEligibilityInput } from "./push-eligibility.js";
import {
  processPushDecision,
  type ProcessPushDecisionResult,
} from "./process-push-decision.js";
import type { SupabaseClientLike as RecordSupabaseClientLike } from "./record-notification-attempt.js";
import type { PushProviderAdapter } from "./test-push-provider.js";
import type { SupabaseClientLike as UpdateSupabaseClientLike } from "./update-notification-attempt-result.js";

type NotificationsSupabaseClientLike = RecordSupabaseClientLike & UpdateSupabaseClientLike;

type RecipientPushContext = NonNullable<PushEligibilityInput["customer"]>;
type PushDeviceContext = PushEligibilityInput["device"];
type NotificationPrefsContext = PushEligibilityInput["notificationPrefs"];

type NotificationOrchestratorBaseInput = {
  supabase: NotificationsSupabaseClientLike;
  provider: PushProviderAdapter;
  nowIso: string;
  businessId: string;
  recipient: RecipientPushContext;
  device?: PushDeviceContext;
  notificationPrefs?: NotificationPrefsContext;
  dedupeAlreadySent?: boolean;
};

function eligibilityInput(base: NotificationOrchestratorBaseInput) {
  return {
    customer: base.recipient,
    device: base.device ?? null,
    notificationPrefs: base.notificationPrefs ?? null,
    nowIso: base.nowIso,
    dedupeAlreadySent: base.dedupeAlreadySent ?? false,
  };
}

export async function queueCustomerOfferSentNotification(
  input: NotificationOrchestratorBaseInput & {
    offer: { id: string; open_slot_id: string };
    slot: { service_name?: string | null; starts_at?: string | null };
  },
): Promise<ProcessPushDecisionResult> {
  const decision = decideCustomerOfferSentPush({
    payloadInput: {
      businessId: input.businessId,
      customerId: input.recipient.id,
      openSlotId: input.offer.open_slot_id,
      offerId: input.offer.id,
      serviceName: input.slot.service_name,
      startsAt: input.slot.starts_at,
      createdAt: input.nowIso,
    },
    eligibilityInput: eligibilityInput(input),
  });
  return processPushDecision({ supabase: input.supabase, provider: input.provider, decision });
}

export async function queueOperatorClaimNeedsConfirmationNotification(
  input: NotificationOrchestratorBaseInput & {
    claim: { id: string; customer_id?: string | null; open_slot_id: string };
    slot: { service_name?: string | null; starts_at?: string | null };
  },
): Promise<ProcessPushDecisionResult> {
  const decision = decideOperatorClaimNeedsConfirmationPush({
    payloadInput: {
      businessId: input.businessId,
      openSlotId: input.claim.open_slot_id,
      claimId: input.claim.id,
      customerId: input.claim.customer_id,
      serviceName: input.slot.service_name,
      startsAt: input.slot.starts_at,
      createdAt: input.nowIso,
    },
    eligibilityInput: eligibilityInput(input),
  });
  return processPushDecision({ supabase: input.supabase, provider: input.provider, decision });
}

export async function queueCustomerBookingConfirmedNotification(
  input: NotificationOrchestratorBaseInput & {
    claim: { id: string; open_slot_id: string };
    slot: { service_name?: string | null; starts_at?: string | null };
  },
): Promise<ProcessPushDecisionResult> {
  const decision = decideCustomerBookingConfirmedPush({
    payloadInput: {
      businessId: input.businessId,
      customerId: input.recipient.id,
      openSlotId: input.claim.open_slot_id,
      claimId: input.claim.id,
      serviceName: input.slot.service_name,
      startsAt: input.slot.starts_at,
      createdAt: input.nowIso,
    },
    eligibilityInput: eligibilityInput(input),
  });
  return processPushDecision({ supabase: input.supabase, provider: input.provider, decision });
}

export async function queueCustomerLostOpportunityNotification(
  input: NotificationOrchestratorBaseInput & {
    slot: { id: string; service_name?: string | null };
    claim?: { id?: string | null };
  },
): Promise<ProcessPushDecisionResult> {
  const decision = decideCustomerLostOpportunityPush({
    payloadInput: {
      businessId: input.businessId,
      customerId: input.recipient.id,
      openSlotId: input.slot.id,
      claimId: input.claim?.id ?? null,
      serviceName: input.slot.service_name,
      createdAt: input.nowIso,
    },
    eligibilityInput: eligibilityInput(input),
  });
  return processPushDecision({ supabase: input.supabase, provider: input.provider, decision });
}

export async function queueCustomerStandbySetupSuggestionNotification(
  input: NotificationOrchestratorBaseInput,
): Promise<ProcessPushDecisionResult> {
  const decision = decideCustomerStandbySetupSuggestionPush({
    payloadInput: {
      businessId: input.businessId,
      customerId: input.recipient.id,
      createdAt: input.nowIso,
    },
    eligibilityInput: eligibilityInput(input),
  });
  return processPushDecision({ supabase: input.supabase, provider: input.provider, decision });
}

export async function queueCustomerStandbyStatusReminderNotification(
  input: NotificationOrchestratorBaseInput,
): Promise<ProcessPushDecisionResult> {
  const decision = decideCustomerStandbyStatusReminderPush({
    payloadInput: {
      businessId: input.businessId,
      customerId: input.recipient.id,
      createdAt: input.nowIso,
    },
    eligibilityInput: eligibilityInput(input),
  });
  return processPushDecision({ supabase: input.supabase, provider: input.provider, decision });
}
