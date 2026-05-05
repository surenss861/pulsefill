import { buildCustomerOfferSentPushFields, sendApnsPush } from "@pulsefill/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

import { apnsHostEnvForDeviceRow, readWorkerApnsSecrets } from "../lib/apns-config.js";

export type SendOfferNotificationJobPayload = {
  offerId: string;
  openSlotId: string;
  customerId: string;
  channel: "push" | "sms" | "email";
};

type OpenSlotRow = {
  id: string;
  business_id: string;
  provider_name_snapshot: string | null;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  estimated_value_cents: number | null;
  status: string;
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
        business_id,
        provider_name_snapshot,
        service_id,
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
  const slotRow = slot as OpenSlotRow | undefined;
  const providerName = slotRow?.provider_name_snapshot ?? "Earlier appointment available";

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
      openSlotStatus: slotRow?.status ?? null,
      expiresAt: offer.expires_at ?? null,
      offerStatus: offer.status,
    });
  }

  if (channel === "push") {
    if (customer.push_enabled === false) {
      return await markOfferDelivered(supabase, {
        offerId,
        customerId,
        openSlotId: offer.open_slot_id,
        channel,
        metadata: {
          delivery_mode: "skipped",
          skip_reason: "customer_push_disabled",
          provider_name_snapshot: providerName,
          open_slot_status: slotRow?.status ?? null,
          expires_at: offer.expires_at ?? null,
          offer_status_before_delivery: offer.status,
        },
      });
    }

    const { data: devices, error: devicesError } = await supabase
      .from("customer_push_devices")
      .select("device_token, environment, token_type")
      .eq("customer_id", customerId)
      .eq("platform", "ios")
      .eq("active", true)
      .eq("token_type", "apns");

    if (devicesError) throw new Error(`Failed to load push devices: ${devicesError.message}`);

    const rows = (devices ?? []).filter((d) => d.device_token);
    if (rows.length === 0) {
      return await markOfferFailed(supabase, {
        offerId,
        customerId,
        reason: "no_push_device",
        channel,
        openSlotId: offer.open_slot_id,
        providerName,
        openSlotStatus: slotRow?.status ?? null,
        expiresAt: offer.expires_at ?? null,
        offerStatus: offer.status,
      });
    }

    const apnsSecrets = readWorkerApnsSecrets();
    const nowIso = new Date().toISOString();
    const businessId = slotRow?.business_id;
    if (!businessId) {
      return await markOfferFailed(supabase, {
        offerId,
        customerId,
        reason: "open_slot_missing_business",
        channel,
        openSlotId: offer.open_slot_id,
        providerName,
        openSlotStatus: slotRow?.status ?? null,
        expiresAt: offer.expires_at ?? null,
        offerStatus: offer.status,
      });
    }

    let serviceName: string | null = null;
    if (slotRow?.service_id) {
      const { data: svc } = await supabase.from("services").select("name").eq("id", slotRow.service_id).maybeSingle();
      serviceName = (svc as { name?: string } | null)?.name?.trim() || null;
    }

    const pushFields = buildCustomerOfferSentPushFields({
      businessId,
      customerId,
      openSlotId: offer.open_slot_id,
      offerId,
      serviceName,
      startsAt: slotRow?.starts_at ?? null,
      createdAt: nowIso,
    });

    const body: Record<string, unknown> = {
      aps: {
        alert: { title: pushFields.title, body: pushFields.body },
        sound: "default",
      },
      ...pushFields.data,
      type: pushFields.type,
      deep_link: pushFields.deep_link,
      dedupe_key: pushFields.dedupe_key,
    };

    if (!apnsSecrets) {
      console.log("[PulseFill] send offer push: APNS not configured (set PUSH_PROVIDER=apns and APNS_* env)", {
        offerId,
        customerId,
        deviceCount: rows.length,
      });
      return await markOfferDelivered(supabase, {
        offerId,
        customerId,
        openSlotId: offer.open_slot_id,
        channel,
        metadata: {
          delivery_mode: "simulated",
          reason: "apns_not_configured",
          provider_name_snapshot: providerName,
          open_slot_status: slotRow?.status ?? null,
          expires_at: offer.expires_at ?? null,
          offer_status_before_delivery: offer.status,
        },
      });
    }

    const sendResults: { tokenSuffix: string; ok: boolean; detail?: string }[] = [];
    let anyOk = false;

    for (const row of rows) {
      const token = row.device_token as string;
      const env = apnsHostEnvForDeviceRow(row.environment as string | undefined);
      const res = await sendApnsPush(
        { ...apnsSecrets, environment: env },
        {
          deviceToken: token,
          collapseId: pushFields.dedupe_key,
          body,
        },
      );
      const suffix = token.length > 8 ? `${token.slice(0, 4)}…${token.slice(-4)}` : "(short)";
      if (res.ok) {
        anyOk = true;
        sendResults.push({ tokenSuffix: suffix, ok: true, detail: res.provider_message_id });
      } else {
        sendResults.push({ tokenSuffix: suffix, ok: false, detail: res.error_code });
        const code = res.error_code.toLowerCase();
        if (code.includes("unregistered") || code.includes("bad_device") || code.includes("baddevicetoken")) {
          await supabase
            .from("customer_push_devices")
            .update({ active: false, updated_at: nowIso })
            .eq("customer_id", customerId)
            .eq("device_token", token)
            .eq("platform", "ios");
        }
      }
    }

    if (!anyOk) {
      return await markOfferFailed(supabase, {
        offerId,
        customerId,
        reason: "apns_all_devices_failed",
        channel,
        openSlotId: offer.open_slot_id,
        providerName,
        openSlotStatus: slotRow?.status ?? null,
        expiresAt: offer.expires_at ?? null,
        offerStatus: offer.status,
        extraMetadata: { apns_attempts: sendResults },
      });
    }

    return await markOfferDelivered(supabase, {
      offerId,
      customerId,
      openSlotId: offer.open_slot_id,
      channel,
      metadata: {
        delivery_mode: "apns",
        provider_name_snapshot: providerName,
        open_slot_status: slotRow?.status ?? null,
        expires_at: offer.expires_at ?? null,
        offer_status_before_delivery: offer.status,
        apns_attempts: sendResults,
      },
    });
  }

  console.log("[PulseFill] send offer notification (non-push stub)", {
    offerId,
    channel,
    customerId,
    providerName,
  });

  return await markOfferDelivered(supabase, {
    offerId,
    customerId,
    openSlotId: offer.open_slot_id,
    channel,
    metadata: {
      delivery_mode: "stub",
      provider_name_snapshot: providerName,
      open_slot_status: slotRow?.status ?? null,
      expires_at: offer.expires_at ?? null,
      offer_status_before_delivery: offer.status,
    },
  });
}

async function markOfferDelivered(
  supabase: SupabaseClient,
  args: {
    offerId: string;
    customerId: string;
    openSlotId: string;
    channel: SendOfferNotificationJobPayload["channel"];
    metadata: Record<string, unknown>;
  },
) {
  const { error: deliveredError } = await supabase
    .from("slot_offers")
    .update({ status: "delivered" })
    .eq("id", args.offerId)
    .eq("status", "sent");

  if (deliveredError) throw new Error(`Failed to mark delivered: ${deliveredError.message}`);

  const { error: logError } = await supabase.from("notification_logs").insert({
    customer_id: args.customerId,
    open_slot_id: args.openSlotId,
    slot_offer_id: args.offerId,
    channel: args.channel,
    status: "delivered",
    metadata: args.metadata,
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
  extraMetadata?: Record<string, unknown>;
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
      delivery_mode: "failed",
      provider_name_snapshot: ctx.providerName,
      open_slot_status: ctx.openSlotStatus,
      expires_at: ctx.expiresAt,
      offer_status_before_delivery: ctx.offerStatus,
      ...(ctx.extraMetadata ?? {}),
    },
  });

  return { ok: false as const, reason: ctx.reason };
}
