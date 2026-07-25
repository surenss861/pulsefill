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

/**
 * notification_logs rows are created at send-time (RPC / bulk-actions) with a
 * not-yet-resolved status ("pending_queue" / "queued") so operator-facing
 * views (inspect logs, delivery reliability) have something to read. This is
 * the single place that resolves them to a terminal status, now that push
 * delivery itself happens exactly once here (not duplicated in the worker).
 */
async function recordOfferNotificationLogOutcome(
  supabase: ReturnType<typeof createServiceSupabase>,
  offerId: string,
  outcome: { status: "delivered" | "failed"; error?: string | null },
) {
  await supabase
    .from("notification_logs")
    .update({ status: outcome.status, error: outcome.error ?? null })
    .eq("slot_offer_id", offerId)
    .in("status", ["pending_queue", "queued"]);
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
  const result = await handleCustomerOfferSentNotificationEvent({
    supabase: params.supabase as unknown as NotificationEventSupabase,
    provider: createPushProviderFromEnv(params.env),
    nowIso: new Date().toISOString(),
    businessId: params.businessId,
    offerId: params.offerId,
    customerId: params.customerId,
  });

  if (!result.ok) {
    await recordOfferNotificationLogOutcome(params.supabase, params.offerId, {
      status: "failed",
      error: result.error,
    });
    return;
  }
  if (result.outcome === "skipped") {
    await recordOfferNotificationLogOutcome(params.supabase, params.offerId, {
      status: "failed",
      error: result.reason,
    });
    return;
  }
  // outcome === "processed": "sent" and the benign "suppressed"/"skipped"
  // (preference off, no device, dedupe) all land in "delivered" — matching
  // the prior worker semantics where an intentional non-send wasn't a failure.
  const providerResult = result.result.status === "failed" ? result.result.provider_result : null;
  const status = providerResult && !providerResult.ok ? "failed" : "delivered";
  const error = providerResult && !providerResult.ok ? providerResult.error_code : null;
  await recordOfferNotificationLogOutcome(params.supabase, params.offerId, { status, error });
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
