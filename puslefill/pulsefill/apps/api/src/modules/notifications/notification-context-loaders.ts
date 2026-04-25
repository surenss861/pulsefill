import {
  getActivePushDeviceForCustomer,
  type ActivePushDevice,
  type PushDevicePlatform,
  type PushDeviceTokenType,
} from "./active-push-device.js";

type SupabaseClientLike = {
  from: (table: string) => {
    select: (fields: string) => {
      eq: (field: string, value: string | boolean) => any;
    };
  };
};

export type NotificationContextLoadResult<T> =
  | { ok: true; context: T }
  | {
      ok: false;
      reason:
        | "missing_customer"
        | "missing_offer"
        | "missing_claim"
        | "missing_slot"
        | "unsupported_recipient"
        | "lookup_failed";
      retryable: boolean;
    };

type RecipientContext = {
  id: string;
  push_enabled?: boolean | null;
  push_permission?: "granted" | "denied" | "unknown" | null;
};

type NotificationPrefsContext = {
  push_enabled?: boolean | null;
  disabled_types?: string[] | null;
  quiet_hours_enabled?: boolean | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  timezone?: string | null;
};

type LoaderDeps = {
  getActivePushDevice?: (input: {
    supabase: SupabaseClientLike;
    customerId: string;
    platform?: PushDevicePlatform;
    tokenType?: PushDeviceTokenType;
  }) => Promise<ActivePushDevice | null>;
};

function toHm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value) return null;
  return value.slice(0, 5);
}

function prefsToEligibility(
  row: Record<string, unknown> | null,
  eventToggle:
    | "notify_new_offers"
    | "notify_claim_updates"
    | "notify_booking_confirmations"
    | "notify_standby_tips",
): NotificationPrefsContext {
  const enabled = row?.[eventToggle] !== false;
  return {
    push_enabled: enabled,
    disabled_types: enabled ? [] : ["all"],
    quiet_hours_enabled: Boolean(row?.quiet_hours_enabled),
    quiet_hours_start: toHm(row?.quiet_hours_start_local),
    quiet_hours_end: toHm(row?.quiet_hours_end_local),
    timezone: null,
  };
}

async function loadCustomer(
  supabase: SupabaseClientLike,
  customerId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw new Error(`customer_lookup_failed:${error.code ?? "unknown"}`);
  return data;
}

async function loadPreferences(
  supabase: SupabaseClientLike,
  customerId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("customer_notification_preferences")
    .select(
      "quiet_hours_enabled, quiet_hours_start_local, quiet_hours_end_local, notify_new_offers, notify_claim_updates, notify_booking_confirmations, notify_standby_tips",
    )
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw new Error(`notification_prefs_lookup_failed:${error.code ?? "unknown"}`);
  return data;
}

async function loadServiceName(
  supabase: SupabaseClientLike,
  serviceId: string | null | undefined,
): Promise<string | null> {
  if (!serviceId) return null;
  const { data, error } = await supabase
    .from("services")
    .select("name")
    .eq("id", serviceId)
    .maybeSingle();
  if (error) throw new Error(`service_lookup_failed:${error.code ?? "unknown"}`);
  return typeof data?.name === "string" ? data.name : null;
}

export async function loadCustomerOfferSentNotificationContext(
  input: {
    supabase: SupabaseClientLike;
    businessId: string;
    offerId: string;
    customerId: string;
    platform?: PushDevicePlatform;
    tokenType?: PushDeviceTokenType;
  },
  deps: LoaderDeps = {},
): Promise<
  NotificationContextLoadResult<{
    businessId: string;
    recipient: RecipientContext;
    device: ActivePushDevice | null;
    notificationPrefs: NotificationPrefsContext;
    offer: { id: string; open_slot_id: string };
    slot: { service_name?: string | null; starts_at?: string | null };
  }>
> {
  try {
    const customer = await loadCustomer(input.supabase, input.customerId);
    if (!customer) return { ok: false, reason: "missing_customer", retryable: false };

    const { data: offer, error: offerErr } = await input.supabase
      .from("slot_offers")
      .select("id, customer_id, open_slot_id")
      .eq("id", input.offerId)
      .eq("customer_id", input.customerId)
      .maybeSingle();
    if (offerErr) return { ok: false, reason: "lookup_failed", retryable: true };
    if (!offer) return { ok: false, reason: "missing_offer", retryable: false };

    const { data: slot, error: slotErr } = await input.supabase
      .from("open_slots")
      .select("id, business_id, starts_at, service_id")
      .eq("id", String(offer.open_slot_id))
      .eq("business_id", input.businessId)
      .maybeSingle();
    if (slotErr) return { ok: false, reason: "lookup_failed", retryable: true };
    if (!slot) return { ok: false, reason: "missing_slot", retryable: false };

    const [prefs, serviceName, device] = await Promise.all([
      loadPreferences(input.supabase, input.customerId),
      loadServiceName(input.supabase, slot.service_id as string | null),
      (deps.getActivePushDevice ?? getActivePushDeviceForCustomer)({
        supabase: input.supabase as any,
        customerId: input.customerId,
        platform: input.platform,
        tokenType: input.tokenType,
      }),
    ]);

    return {
      ok: true,
      context: {
        businessId: input.businessId,
        recipient: { id: input.customerId, push_enabled: true, push_permission: "unknown" },
        device,
        notificationPrefs: prefsToEligibility(prefs, "notify_new_offers"),
        offer: { id: String(offer.id), open_slot_id: String(offer.open_slot_id) },
        slot: { service_name: serviceName, starts_at: (slot.starts_at as string | null) ?? null },
      },
    };
  } catch {
    return { ok: false, reason: "lookup_failed", retryable: true };
  }
}

export async function loadCustomerBookingConfirmedNotificationContext(
  input: {
    supabase: SupabaseClientLike;
    businessId: string;
    claimId: string;
    platform?: PushDevicePlatform;
    tokenType?: PushDeviceTokenType;
  },
  deps: LoaderDeps = {},
): Promise<
  NotificationContextLoadResult<{
    businessId: string;
    recipient: RecipientContext;
    device: ActivePushDevice | null;
    notificationPrefs: NotificationPrefsContext;
    claim: { id: string; open_slot_id: string };
    slot: { service_name?: string | null; starts_at?: string | null };
  }>
> {
  try {
    const { data: claim, error: claimErr } = await input.supabase
      .from("slot_claims")
      .select("id, customer_id, open_slot_id")
      .eq("id", input.claimId)
      .maybeSingle();
    if (claimErr) return { ok: false, reason: "lookup_failed", retryable: true };
    if (!claim) return { ok: false, reason: "missing_claim", retryable: false };

    const customerId = String(claim.customer_id ?? "");
    if (!customerId) return { ok: false, reason: "missing_customer", retryable: false };

    const customer = await loadCustomer(input.supabase, customerId);
    if (!customer) return { ok: false, reason: "missing_customer", retryable: false };

    const { data: slot, error: slotErr } = await input.supabase
      .from("open_slots")
      .select("id, business_id, starts_at, service_id")
      .eq("id", String(claim.open_slot_id))
      .eq("business_id", input.businessId)
      .maybeSingle();
    if (slotErr) return { ok: false, reason: "lookup_failed", retryable: true };
    if (!slot) return { ok: false, reason: "missing_slot", retryable: false };

    const [prefs, serviceName, device] = await Promise.all([
      loadPreferences(input.supabase, customerId),
      loadServiceName(input.supabase, slot.service_id as string | null),
      (deps.getActivePushDevice ?? getActivePushDeviceForCustomer)({
        supabase: input.supabase as any,
        customerId,
        platform: input.platform,
        tokenType: input.tokenType,
      }),
    ]);

    return {
      ok: true,
      context: {
        businessId: input.businessId,
        recipient: { id: customerId, push_enabled: true, push_permission: "unknown" },
        device,
        notificationPrefs: prefsToEligibility(prefs, "notify_booking_confirmations"),
        claim: { id: String(claim.id), open_slot_id: String(claim.open_slot_id) },
        slot: { service_name: serviceName, starts_at: (slot.starts_at as string | null) ?? null },
      },
    };
  } catch {
    return { ok: false, reason: "lookup_failed", retryable: true };
  }
}

export async function loadOperatorClaimNeedsConfirmationNotificationContext(): Promise<
  NotificationContextLoadResult<never>
> {
  return { ok: false, reason: "unsupported_recipient", retryable: false };
}
