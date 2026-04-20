import { buildCustomerPushFromCustomerEvent } from "@pulsefill/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SendOfferNotificationJobPayload = {
  offerId: string;
  openSlotId: string;
  customerId: string;
  channel: "push" | "sms" | "email";
};

export async function sendOfferNotificationJob(
  supabase: SupabaseClient,
  payload: SendOfferNotificationJobPayload,
) {
  const { offerId, customerId, channel } = payload;

  const { data: offer, error: offerError } = await supabase
    .from("slot_offers")
    .select(
      `
      id,
      open_slot_id,
      status,
      channel,
      expires_at,
      open_slots (
        id,
        provider_name_snapshot,
        starts_at,
        ends_at,
        estimated_value_cents,
        status
      )
    `,
    )
    .eq("id", offerId)
    .maybeSingle();

  if (offerError) throw new Error(`Failed to load offer: ${offerError.message}`);
  if (!offer) return { skipped: true, reason: "offer_missing" as const };
  if (offer.status !== "sent") return { skipped: true, reason: `offer_status_${offer.status}` as const };

  const slot = Array.isArray(offer.open_slots) ? offer.open_slots[0] : offer.open_slots;
  const providerName = slot?.provider_name_snapshot ?? "Earlier appointment available";

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, email, phone, push_enabled, sms_enabled, email_enabled")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) throw new Error(`Failed to load customer: ${customerError.message}`);
  if (!customer) {
    return await markOfferFailed(supabase, {
      offerId,
      customerId: null,
      reason: "customer_missing",
      channel,
      openSlotId: offer.open_slot_id,
      providerName,
      openSlotStatus: slot?.status ?? null,
      expiresAt: offer.expires_at ?? null,
      offerStatus: offer.status,
    });
  }

  if (channel === "push") {
    const { data: devices, error: devicesError } = await supabase
      .from("customer_push_devices")
      .select("device_token")
      .eq("customer_id", customerId)
      .eq("platform", "ios")
      .eq("active", true);

    if (devicesError) throw new Error(`Failed to load push devices: ${devicesError.message}`);

    const deviceTokens = (devices ?? []).map((d) => d.device_token).filter(Boolean);
    if (deviceTokens.length === 0) {
      return await markOfferFailed(supabase, {
        offerId,
        customerId,
        reason: "no_push_device",
        channel,
        openSlotId: offer.open_slot_id,
        providerName,
        openSlotStatus: slot?.status ?? null,
        expiresAt: offer.expires_at ?? null,
        offerStatus: offer.status,
      });
    }

    const apsPayload = buildCustomerPushFromCustomerEvent({
      kind: "offer_received",
      businessName: providerName,
      offerId,
      openSlotId: offer.open_slot_id,
    });
    console.log("[PulseFill] send offer push (simulated until APNs wired)", {
      offerId,
      customerId,
      deviceCount: deviceTokens.length,
      providerName,
      apsPayload,
    });
  } else {
    console.log("[PulseFill] send offer notification (non-push stub)", {
      offerId,
      channel,
      customerId,
      providerName,
    });
  }

  const { error: deliveredError } = await supabase
    .from("slot_offers")
    .update({ status: "delivered" })
    .eq("id", offerId)
    .eq("status", "sent");

  if (deliveredError) throw new Error(`Failed to mark delivered: ${deliveredError.message}`);

  const { error: logError } = await supabase.from("notification_logs").insert({
    customer_id: customerId,
    open_slot_id: offer.open_slot_id,
    slot_offer_id: offerId,
    channel,
    status: "delivered",
    metadata: {
      delivery_mode: "simulated",
      provider_name_snapshot: providerName,
      open_slot_status: slot?.status ?? null,
      offer_status_before_delivery: offer.status,
      expires_at: offer.expires_at ?? null,
    },
  });

  if (logError) throw new Error(`Failed to write notification log: ${logError.message}`);

  return { ok: true as const };
}

type MarkFailedCtx = {
  offerId: string;
  customerId: string | null;
  reason: string;
  channel: "push" | "sms" | "email";
  openSlotId: string;
  providerName: string;
  openSlotStatus: string | null;
  expiresAt: string | null;
  offerStatus: string;
};

async function markOfferFailed(supabase: SupabaseClient, ctx: MarkFailedCtx) {
  await supabase.from("slot_offers").update({ status: "failed" }).eq("id", ctx.offerId).eq("status", "sent");

  await supabase.from("notification_logs").insert({
    customer_id: ctx.customerId,
    open_slot_id: ctx.openSlotId,
    slot_offer_id: ctx.offerId,
    channel: ctx.channel,
    status: "failed",
    metadata: {
      reason: ctx.reason,
      delivery_mode: "simulated",
      provider_name_snapshot: ctx.providerName,
      open_slot_status: ctx.openSlotStatus,
      expires_at: ctx.expiresAt,
      offer_status_before_delivery: ctx.offerStatus,
    },
  });

  return { ok: false as const, reason: ctx.reason };
}
