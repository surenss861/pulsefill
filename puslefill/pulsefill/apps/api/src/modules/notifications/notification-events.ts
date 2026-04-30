import {
  loadCustomerBookingConfirmedNotificationContext,
  loadCustomerOfferSentNotificationContext,
} from "./notification-context-loaders.js";
import {
  queueCustomerBookingConfirmedNotification,
  queueCustomerOfferSentNotification,
} from "./notification-orchestrator.js";
import type { PushDevicePlatform, PushDeviceTokenType } from "./active-push-device.js";
import type { PushProviderAdapter } from "./test-push-provider.js";
import type { ProcessPushDecisionResult } from "./process-push-decision.js";

type CustomerOfferLoaderSupabase = Parameters<typeof loadCustomerOfferSentNotificationContext>[0]["supabase"];
type CustomerBookingLoaderSupabase = Parameters<typeof loadCustomerBookingConfirmedNotificationContext>[0]["supabase"];
type CustomerOfferQueueSupabase = Parameters<typeof queueCustomerOfferSentNotification>[0]["supabase"];
type CustomerBookingQueueSupabase = Parameters<typeof queueCustomerBookingConfirmedNotification>[0]["supabase"];

type NotificationsSupabaseClientLike =
  & CustomerOfferLoaderSupabase
  & CustomerBookingLoaderSupabase
  & CustomerOfferQueueSupabase
  & CustomerBookingQueueSupabase;

export type NotificationEventResult =
  | {
      ok: true;
      outcome: "processed";
      result: ProcessPushDecisionResult;
    }
  | {
      ok: true;
      outcome: "skipped";
      reason: string;
      retryable: boolean;
    }
  | {
      ok: false;
      outcome: "failed";
      error: string;
    };

type EventDeps = {
  loadCustomerOfferSentContext?: typeof loadCustomerOfferSentNotificationContext;
  loadCustomerBookingConfirmedContext?: typeof loadCustomerBookingConfirmedNotificationContext;
  queueCustomerOfferSent?: typeof queueCustomerOfferSentNotification;
  queueCustomerBookingConfirmed?: typeof queueCustomerBookingConfirmedNotification;
};

export async function handleCustomerOfferSentNotificationEvent(
  input: {
    supabase: NotificationsSupabaseClientLike;
    provider: PushProviderAdapter;
    nowIso: string;
    businessId: string;
    offerId: string;
    customerId: string;
    platform?: PushDevicePlatform;
    tokenType?: PushDeviceTokenType;
    dedupeAlreadySent?: boolean;
  },
  deps: EventDeps = {},
): Promise<NotificationEventResult> {
  try {
    const loader = deps.loadCustomerOfferSentContext ?? loadCustomerOfferSentNotificationContext;
    const queue = deps.queueCustomerOfferSent ?? queueCustomerOfferSentNotification;

    const loaded = await loader({
      supabase: input.supabase,
      businessId: input.businessId,
      offerId: input.offerId,
      customerId: input.customerId,
      platform: input.platform,
      tokenType: input.tokenType,
    });

    if (!loaded.ok) {
      return {
        ok: true,
        outcome: "skipped",
        reason: loaded.reason,
        retryable: loaded.retryable,
      };
    }

    const result = await queue({
      supabase: input.supabase,
      provider: input.provider,
      nowIso: input.nowIso,
      businessId: loaded.context.businessId,
      recipient: loaded.context.recipient,
      device: loaded.context.device,
      notificationPrefs: loaded.context.notificationPrefs,
      dedupeAlreadySent: input.dedupeAlreadySent ?? false,
      offer: loaded.context.offer,
      slot: loaded.context.slot,
    });

    return { ok: true, outcome: "processed", result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return {
      ok: false,
      outcome: "failed",
      error: `notification_event_failed:${message}`,
    };
  }
}

export async function handleCustomerBookingConfirmedNotificationEvent(
  input: {
    supabase: NotificationsSupabaseClientLike;
    provider: PushProviderAdapter;
    nowIso: string;
    businessId: string;
    claimId: string;
    platform?: PushDevicePlatform;
    tokenType?: PushDeviceTokenType;
    dedupeAlreadySent?: boolean;
  },
  deps: EventDeps = {},
): Promise<NotificationEventResult> {
  try {
    const loader = deps.loadCustomerBookingConfirmedContext ?? loadCustomerBookingConfirmedNotificationContext;
    const queue = deps.queueCustomerBookingConfirmed ?? queueCustomerBookingConfirmedNotification;

    const loaded = await loader({
      supabase: input.supabase,
      businessId: input.businessId,
      claimId: input.claimId,
      platform: input.platform,
      tokenType: input.tokenType,
    });

    if (!loaded.ok) {
      return {
        ok: true,
        outcome: "skipped",
        reason: loaded.reason,
        retryable: loaded.retryable,
      };
    }

    const result = await queue({
      supabase: input.supabase,
      provider: input.provider,
      nowIso: input.nowIso,
      businessId: loaded.context.businessId,
      recipient: loaded.context.recipient,
      device: loaded.context.device,
      notificationPrefs: loaded.context.notificationPrefs,
      dedupeAlreadySent: input.dedupeAlreadySent ?? false,
      claim: loaded.context.claim,
      slot: loaded.context.slot,
    });

    return { ok: true, outcome: "processed", result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return {
      ok: false,
      outcome: "failed",
      error: `notification_event_failed:${message}`,
    };
  }
}
