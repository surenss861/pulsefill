import type { FastifyInstance } from "fastify";
import type { createServiceSupabase } from "../../config/supabase.js";
import {
  handleCustomerBookingConfirmedNotificationEvent,
  handleCustomerOfferSentNotificationEvent,
} from "../notifications/notification-events.js";
import { createPushProviderFromEnv } from "../notifications/provider-factory.js";

type NotificationEventSupabase =
  & Parameters<typeof handleCustomerOfferSentNotificationEvent>[0]["supabase"]
  & Parameters<typeof handleCustomerBookingConfirmedNotificationEvent>[0]["supabase"];

type NotificationEventHookDelegate = {
  onCustomerOfferSent?: (input: {
    businessId: string;
    offerId: string;
    customerId: string;
  }) => Promise<void>;
  onCustomerBookingConfirmed?: (input: {
    businessId: string;
    claimId: string;
  }) => Promise<void>;
};

let notificationEventHookDelegate: NotificationEventHookDelegate | null = null;

export function setNotificationEventHookTestDelegate(delegate: NotificationEventHookDelegate | null) {
  notificationEventHookDelegate = delegate;
}

export async function notifyCustomerOfferSent(params: {
  env: FastifyInstance["env"];
  supabase: ReturnType<typeof createServiceSupabase>;
  businessId: string;
  offerId: string;
  customerId: string;
}) {
  if (notificationEventHookDelegate?.onCustomerOfferSent) {
    await notificationEventHookDelegate.onCustomerOfferSent({
      businessId: params.businessId,
      offerId: params.offerId,
      customerId: params.customerId,
    });
    return;
  }
  await handleCustomerOfferSentNotificationEvent({
    supabase: params.supabase as unknown as NotificationEventSupabase,
    provider: createPushProviderFromEnv(params.env),
    nowIso: new Date().toISOString(),
    businessId: params.businessId,
    offerId: params.offerId,
    customerId: params.customerId,
  });
}

export async function notifyCustomerBookingConfirmed(params: {
  env: FastifyInstance["env"];
  supabase: ReturnType<typeof createServiceSupabase>;
  businessId: string;
  claimId: string;
}) {
  if (notificationEventHookDelegate?.onCustomerBookingConfirmed) {
    await notificationEventHookDelegate.onCustomerBookingConfirmed({
      businessId: params.businessId,
      claimId: params.claimId,
    });
    return;
  }
  await handleCustomerBookingConfirmedNotificationEvent({
    supabase: params.supabase as unknown as NotificationEventSupabase,
    provider: createPushProviderFromEnv(params.env),
    nowIso: new Date().toISOString(),
    businessId: params.businessId,
    claimId: params.claimId,
  });
}
