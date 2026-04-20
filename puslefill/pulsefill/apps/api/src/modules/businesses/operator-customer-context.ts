import type { SupabaseClient } from "@supabase/supabase-js";

export type OperatorCustomerContextResponse = {
  customer: {
    id: string;
    display_name: string | null;
    email_masked: string | null;
    phone_masked: string | null;
    push_enabled: boolean;
    sms_enabled: boolean;
    email_enabled: boolean;
  };
  standby_preferences: Array<{
    id: string;
    active: boolean;
    business_name: string | null;
    service_name: string | null;
    location_name: string | null;
    provider_name: string | null;
    days_of_week: number[];
    earliest_time: string | null;
    latest_time: string | null;
    max_notice_hours: number | null;
    deposit_ok: boolean;
  }>;
  delivery_context: {
    push_devices_count: number;
    has_push_ready: boolean;
    has_email: boolean;
    has_sms: boolean;
    has_any_reachable_channel: boolean;
    last_failed_delivery_at: string | null;
    last_failed_delivery_reason: string | null;
  };
};

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return `${email.slice(0, 2)}…`;
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (user.length <= 2) return `${user[0] ?? "?"}…@${domain}`;
  return `${user.slice(0, 2)}…@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "…";
  return `…${digits.slice(-4)}`;
}

function formatTimeHm(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = String(value).trim();
  if (s.length >= 5) return s.slice(0, 5);
  return s;
}

type PrefRow = {
  id: string;
  active: boolean;
  max_notice_hours: number | null;
  earliest_time: string | null;
  latest_time: string | null;
  days_of_week: number[] | null;
  deposit_ok: boolean;
  businesses?: { name: string } | { name: string }[] | null;
  services?: { name: string } | { name: string }[] | null;
  locations?: { name: string } | { name: string }[] | null;
  providers?: { name: string } | { name: string }[] | null;
};

function pickName(rel: unknown): string | null {
  if (!rel) return null;
  const o = Array.isArray(rel) ? rel[0] : rel;
  if (o && typeof o === "object" && "name" in o && typeof (o as { name: unknown }).name === "string") {
    const n = (o as { name: string }).name.trim();
    return n || null;
  }
  return null;
}

async function customerHasBusinessContext(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
): Promise<boolean> {
  const { data: pref } = await admin
    .from("standby_preferences")
    .select("id")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle();
  if (pref) return true;

  const { data: claimRows } = await admin
    .from("slot_claims")
    .select("id, open_slots!inner(business_id)")
    .eq("customer_id", customerId)
    .eq("open_slots.business_id", businessId)
    .limit(1);
  if ((claimRows?.length ?? 0) > 0) return true;

  const { data: offerRows } = await admin
    .from("slot_offers")
    .select("id, open_slots!inner(business_id)")
    .eq("customer_id", customerId)
    .eq("open_slots.business_id", businessId)
    .limit(1);
  return (offerRows?.length ?? 0) > 0;
}

export async function buildOperatorCustomerContext(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
): Promise<OperatorCustomerContextResponse | { error: "not_found" | "forbidden" }> {
  const { data: cust, error: custErr } = await admin
    .from("customers")
    .select("id, full_name, email, phone, push_enabled, sms_enabled, email_enabled")
    .eq("id", customerId)
    .maybeSingle();

  if (custErr || !cust) {
    return { error: "not_found" };
  }

  const ok = await customerHasBusinessContext(admin, businessId, customerId);
  if (!ok) {
    return { error: "forbidden" };
  }

  const c = cust as {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    push_enabled: boolean;
    sms_enabled: boolean;
    email_enabled: boolean;
  };

  const displayName = c.full_name?.trim() || null;
  const emailMasked = c.email?.trim() ? maskEmail(c.email.trim()) : null;
  const phoneMasked = c.phone?.trim() ? maskPhone(c.phone.trim()) : null;

  const { data: prefRows, error: prefErr } = await admin
    .from("standby_preferences")
    .select(
      `
      id,
      active,
      max_notice_hours,
      earliest_time,
      latest_time,
      days_of_week,
      deposit_ok,
      businesses ( name ),
      services ( name ),
      locations ( name ),
      providers ( name )
    `,
    )
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (prefErr) {
    throw new Error("standby_preferences_failed");
  }

  const standby_preferences = (prefRows ?? []).map((row) => {
    const r = row as PrefRow;
    return {
      id: r.id,
      active: r.active,
      business_name: pickName(r.businesses),
      service_name: pickName(r.services),
      location_name: pickName(r.locations),
      provider_name: pickName(r.providers),
      days_of_week: Array.isArray(r.days_of_week) ? r.days_of_week.map(Number) : [],
      earliest_time: formatTimeHm(r.earliest_time),
      latest_time: formatTimeHm(r.latest_time),
      max_notice_hours: r.max_notice_hours,
      deposit_ok: Boolean(r.deposit_ok),
    };
  });

  const { count: pushCount } = await admin
    .from("customer_push_devices")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("active", true);

  const hasDevice = (pushCount ?? 0) > 0;
  const has_push_ready = hasDevice && Boolean(c.push_enabled);
  const has_email = Boolean(c.email?.trim()) && Boolean(c.email_enabled);
  const has_sms = Boolean(c.phone?.trim()) && Boolean(c.sms_enabled);
  const has_any_reachable_channel = has_push_ready || has_email || has_sms;

  const { data: slotRows } = await admin.from("open_slots").select("id").eq("business_id", businessId);

  const slotIds = (slotRows ?? []).map((s) => (s as { id: string }).id);
  let last_failed_delivery_at: string | null = null;
  let last_failed_delivery_reason: string | null = null;
  if (slotIds.length > 0) {
    const { data: failLog } = await admin
      .from("notification_logs")
      .select("created_at, error")
      .eq("customer_id", customerId)
      .eq("status", "failed")
      .in("open_slot_id", slotIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    last_failed_delivery_at = (failLog as { created_at?: string } | null)?.created_at ?? null;
    const err = (failLog as { error?: string | null } | null)?.error;
    last_failed_delivery_reason = err && String(err).trim() ? String(err).trim() : null;
  }

  return {
    customer: {
      id: c.id,
      display_name: displayName,
      email_masked: emailMasked,
      phone_masked: phoneMasked,
      push_enabled: Boolean(c.push_enabled),
      sms_enabled: Boolean(c.sms_enabled),
      email_enabled: Boolean(c.email_enabled),
    },
    standby_preferences,
    delivery_context: {
      push_devices_count: pushCount ?? 0,
      has_push_ready,
      has_email,
      has_sms,
      has_any_reachable_channel,
      last_failed_delivery_at,
      last_failed_delivery_reason,
    },
  };
}
