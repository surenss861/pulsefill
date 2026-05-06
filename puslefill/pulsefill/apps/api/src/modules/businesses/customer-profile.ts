import type { SupabaseClient } from "@supabase/supabase-js";

import { customerBelongsToStaffBusiness } from "./operator-customer-context.js";

const WINDOW_DAYS = 30;

export type CustomerProfileMembership = {
  status: "active" | "pending" | "revoked" | "none";
  source: "invite" | "request" | "public" | null;
  joined_at: string | null;
};

export type CustomerProfileStandby = {
  active_preferences_count: number;
  services: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  notice_summary: string;
  availability_summary: string;
};

export type CustomerProfileReachability = {
  push_enabled: boolean;
  active_push_devices: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  status: "reachable" | "limited" | "unreachable";
};

export type CustomerProfileClaims = {
  total: number;
  confirmed: number;
  waiting: number;
  expired_or_missed: number;
};

export type CustomerProfileActivity = {
  kind: string;
  title: string;
  description: string;
  occurred_at: string;
};

export type CustomerProfileNextAction = {
  label: string;
  href: string;
  priority: "primary" | "secondary";
};

export type CustomerProfileFollowUp = {
  /** Plain email for staff mailto / copy; same access boundary as this endpoint. */
  contact_email: string | null;
  /** Plain phone for staff tel / copy. */
  contact_phone: string | null;
  can_email: boolean;
  can_call: boolean;
  suggested_action: "review_request" | "invite_customer" | "none";
};

export type CustomerProfileResponse = {
  customer: {
    id: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
  };
  membership: CustomerProfileMembership;
  follow_up: CustomerProfileFollowUp;
  standby: CustomerProfileStandby;
  reachability: CustomerProfileReachability;
  claims: CustomerProfileClaims;
  recent_activity: CustomerProfileActivity[];
  notification_delivery: {
    sent_30d: number;
    failed_30d: number;
    skipped_30d: number;
  };
  next_actions: CustomerProfileNextAction[];
};

function followUpSuggestedAction(membership: CustomerProfileMembership): CustomerProfileFollowUp["suggested_action"] {
  if (membership.status === "pending") return "review_request";
  if (membership.status !== "active") return "invite_customer";
  return "none";
}

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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function summarizeDays(days: number[]): string {
  const sorted = [...new Set(days.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  if (sorted.length === 0) return "Not set";
  if (sorted.length === 7) return "Every day";
  return sorted.map((d) => DAY_NAMES[d] ?? String(d)).join(", ");
}

function pickName(rel: unknown): string | null {
  if (!rel) return null;
  const o = Array.isArray(rel) ? rel[0] : rel;
  if (o && typeof o === "object" && "name" in o && typeof (o as { name: unknown }).name === "string") {
    const n = (o as { name: string }).name.trim();
    return n || null;
  }
  return null;
}

/** Same semantics as Customer 360 / standby coverage — keeps invite onboarding aligned with profile. */
export function computeReachabilityLevel(input: {
  push_enabled: boolean;
  active_push_devices: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  has_email: boolean;
  has_sms: boolean;
}): "reachable" | "limited" | "unreachable" {
  const pushReady = input.push_enabled && input.active_push_devices > 0;
  const emailReach = input.email_enabled && input.has_email;
  const smsReach = input.sms_enabled && input.has_sms;
  if (pushReady || emailReach || smsReach) {
    const partial =
      (input.push_enabled && !pushReady) ||
      (input.email_enabled && !emailReach) ||
      (input.sms_enabled && !smsReach);
    return partial ? "limited" : "reachable";
  }
  if (input.push_enabled || input.email_enabled || input.sms_enabled) return "limited";
  return "unreachable";
}

let buildCustomerProfileTestDelegate:
  | null
  | ((admin: SupabaseClient, businessId: string, customerId: string) => Promise<CustomerProfileResponse>) = null;

export function setBuildCustomerProfileTestDelegate(
  delegate: ((admin: SupabaseClient, businessId: string, customerId: string) => Promise<CustomerProfileResponse>) | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("customer profile test delegate only when PULSEFILL_API_TEST=1");
  }
  buildCustomerProfileTestDelegate = delegate;
}

export async function buildCustomerProfile(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
): Promise<CustomerProfileResponse> {
  if (buildCustomerProfileTestDelegate) {
    return buildCustomerProfileTestDelegate(admin, businessId, customerId);
  }

  const allowed = await customerBelongsToStaffBusiness(admin, businessId, customerId);
  if (!allowed) {
    throw new Error("customer_profile_not_found");
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: cust, error: custErr } = await admin
    .from("customers")
    .select("id, full_name, email, phone, push_enabled, sms_enabled, email_enabled, created_at")
    .eq("id", customerId)
    .maybeSingle();

  if (custErr || !cust) {
    throw new Error("customer_profile_not_found");
  }

  const c = cust as {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    push_enabled: boolean;
    sms_enabled: boolean;
    email_enabled: boolean;
    created_at: string;
  };

  const displayName = c.full_name?.trim() || "Customer";
  const emailOut = c.email?.trim() ? maskEmail(c.email.trim()) : null;
  const phoneOut = c.phone?.trim() ? maskPhone(c.phone.trim()) : null;

  const [{ data: memRow }, { data: pendingReq }] = await Promise.all([
    admin
      .from("customer_business_memberships")
      .select("status, source, created_at")
      .eq("customer_id", customerId)
      .eq("business_id", businessId)
      .maybeSingle(),
    admin
      .from("customer_standby_requests")
      .select("requested_at, status")
      .eq("customer_id", customerId)
      .eq("business_id", businessId)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  let membership: CustomerProfileMembership;
  if (memRow && typeof (memRow as { status?: string }).status === "string") {
    const m = memRow as { status: string; source: string; created_at: string };
    const st = m.status === "revoked" ? "revoked" : "active";
    const src = m.source === "request" || m.source === "public" || m.source === "invite" ? m.source : "invite";
    membership = { status: st, source: src, joined_at: m.created_at };
  } else if (pendingReq && typeof (pendingReq as { requested_at?: string }).requested_at === "string") {
    const r = pendingReq as { requested_at: string };
    membership = { status: "pending", source: "request", joined_at: r.requested_at };
  } else {
    membership = { status: "none", source: null, joined_at: null };
  }

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
      updated_at,
      services ( id, name ),
      locations ( id, name )
    `,
    )
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (prefErr) throw new Error("customer_profile_prefs_failed");

  const prefs = (prefRows ?? []) as Array<{
    active: boolean;
    max_notice_hours: number | null;
    earliest_time: string | null;
    latest_time: string | null;
    days_of_week: number[] | null;
    updated_at: string;
    services?: { id: string; name: string } | { id: string; name: string }[] | null;
    locations?: { id: string; name: string } | { id: string; name: string }[] | null;
  }>;

  const activePrefs = prefs.filter((p) => p.active);
  const active_preferences_count = activePrefs.length;

  const serviceMap = new Map<string, string>();
  const locMap = new Map<string, string>();
  const allDays = new Set<number>();
  let minNotice: number | null = null;
  let maxNotice: number | null = null;
  let minEar: string | null = null;
  let maxLat: string | null = null;

  for (const p of activePrefs) {
    const sid = Array.isArray(p.services) ? p.services[0]?.id : p.services?.id;
    const sn = Array.isArray(p.services) ? p.services[0]?.name : p.services?.name;
    if (sid && sn) serviceMap.set(sid, sn);
    const lid = Array.isArray(p.locations) ? p.locations[0]?.id : p.locations?.id;
    const ln = Array.isArray(p.locations) ? p.locations[0]?.name : p.locations?.name;
    if (lid && ln) locMap.set(lid, ln);
    for (const d of p.days_of_week ?? []) {
      if (typeof d === "number") allDays.add(d);
    }
    if (typeof p.max_notice_hours === "number" && Number.isFinite(p.max_notice_hours)) {
      minNotice = minNotice == null ? p.max_notice_hours : Math.min(minNotice, p.max_notice_hours);
      maxNotice = maxNotice == null ? p.max_notice_hours : Math.max(maxNotice, p.max_notice_hours);
    }
    const e = formatTimeHm(p.earliest_time);
    const l = formatTimeHm(p.latest_time);
    if (e) {
      if (minEar == null || e < minEar) minEar = e;
    }
    if (l) {
      if (maxLat == null || l > maxLat) maxLat = l;
    }
  }

  let notice_summary = "Not set";
  if (minNotice != null && maxNotice != null) {
    notice_summary =
      minNotice === maxNotice ? `About ${minNotice}h notice` : `Notice between ${minNotice}h and ${maxNotice}h`;
  } else if (minNotice != null) {
    notice_summary = `Up to ${minNotice}h notice`;
  }

  const dayPart = summarizeDays([...allDays]);
  const timePart =
    minEar && maxLat ? `${minEar}–${maxLat}` : minEar ? `from ${minEar}` : maxLat ? `until ${maxLat}` : "";
  let availability_summary = dayPart;
  if (timePart) availability_summary = dayPart === "Not set" ? timePart : `${dayPart} · ${timePart}`;

  const { count: pushCount } = await admin
    .from("customer_push_devices")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("active", true)
    .eq("platform", "ios")
    .eq("token_type", "apns");

  const active_push_devices = pushCount ?? 0;
  const has_email = Boolean(c.email?.trim());
  const has_sms = Boolean(c.phone?.trim());
  const reachability: CustomerProfileReachability = {
    push_enabled: Boolean(c.push_enabled),
    active_push_devices,
    email_enabled: Boolean(c.email_enabled),
    sms_enabled: Boolean(c.sms_enabled),
    status: computeReachabilityLevel({
      push_enabled: Boolean(c.push_enabled),
      active_push_devices,
      email_enabled: Boolean(c.email_enabled),
      sms_enabled: Boolean(c.sms_enabled),
      has_email,
      has_sms,
    }),
  };

  const { data: claimAgg, error: claimErr } = await admin
    .from("slot_claims")
    .select("status, open_slots!inner(business_id)")
    .eq("customer_id", customerId)
    .eq("open_slots.business_id", businessId);

  if (claimErr) throw new Error("customer_profile_claims_failed");

  let confirmed = 0;
  let waiting = 0;
  let expired_or_missed = 0;
  for (const row of claimAgg ?? []) {
    const st = String((row as { status?: string }).status || "").toLowerCase();
    if (st === "confirmed") confirmed += 1;
    else if (st === "pending" || st === "won") waiting += 1;
    else if (st === "lost" || st === "failed") expired_or_missed += 1;
  }
  const total = (claimAgg ?? []).length;

  const { data: slotRows } = await admin.from("open_slots").select("id").eq("business_id", businessId).limit(4000);
  const slotIds = (slotRows ?? []).map((r) => (r as { id: string }).id);

  let sent_30d = 0;
  let failed_30d = 0;
  let skipped_30d = 0;
  if (slotIds.length > 0) {
    const chunk = 200;
    for (let i = 0; i < slotIds.length; i += chunk) {
      const slice = slotIds.slice(i, i + chunk);
      const { data: logs, error: logErr } = await admin
        .from("notification_logs")
        .select("status")
        .eq("customer_id", customerId)
        .gte("created_at", since)
        .in("open_slot_id", slice);
      if (logErr) throw new Error("customer_profile_notifications_failed");
      for (const row of logs ?? []) {
        const st = String((row as { status?: string }).status || "").toLowerCase();
        if (st === "delivered") sent_30d += 1;
        else if (st === "failed") failed_30d += 1;
        else if (st === "suppressed" || st === "simulated") skipped_30d += 1;
      }
    }
  }

  const recent_activity: CustomerProfileActivity[] = [];

  if (membership.joined_at && membership.status !== "none") {
    recent_activity.push({
      kind: "membership",
      title: membership.status === "pending" ? "Standby access pending" : "Joined business",
      description:
        membership.status === "pending"
          ? "Customer requested access; approve from Standby requests."
          : `Linked as ${membership.source ?? "member"}.`,
      occurred_at: membership.joined_at,
    });
  }

  const latestPref = activePrefs[0] ?? prefs[0];
  if (latestPref?.updated_at) {
    recent_activity.push({
      kind: "standby_updated",
      title: "Standby preferences",
      description: active_preferences_count > 0 ? "Preferences updated for this business." : "Preference row updated.",
      occurred_at: latestPref.updated_at,
    });
  }

  const { data: recentClaims } = await admin
    .from("slot_claims")
    .select("status, claimed_at, confirmed_at, open_slots!inner(business_id, starts_at)")
    .eq("customer_id", customerId)
    .eq("open_slots.business_id", businessId)
    .order("claimed_at", { ascending: false })
    .limit(6);

  for (const raw of recentClaims ?? []) {
    const row = raw as {
      status: string;
      claimed_at: string;
      confirmed_at?: string | null;
      open_slots?: { starts_at?: string } | { starts_at?: string }[];
    };
    const st = String(row.status || "").toLowerCase();
    const when = row.confirmed_at || row.claimed_at;
    if (st === "confirmed") {
      recent_activity.push({
        kind: "booking_confirmed",
        title: "Booking confirmed",
        description: "Customer claim was confirmed for an opening.",
        occurred_at: when,
      });
    } else if (st === "won") {
      recent_activity.push({
        kind: "claim_waiting",
        title: "Claim awaiting confirmation",
        description: "Customer won an offer; operator confirmation pending.",
        occurred_at: row.claimed_at,
      });
    } else {
      recent_activity.push({
        kind: "claim_activity",
        title: "Claim activity",
        description: `Status: ${st}`,
        occurred_at: row.claimed_at,
      });
    }
  }

  const { data: recentLogs } = await admin
    .from("notification_logs")
    .select("status, created_at")
    .eq("customer_id", customerId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(6);

  for (const raw of recentLogs ?? []) {
    const row = raw as { status: string; created_at: string };
    const st = String(row.status || "").toLowerCase();
    if (st === "delivered") {
      recent_activity.push({
        kind: "notification_sent",
        title: "Opening alert sent",
        description: "A notification was delivered to this customer.",
        occurred_at: row.created_at,
      });
    } else if (st === "failed") {
      recent_activity.push({
        kind: "notification_failed",
        title: "Delivery failed",
        description: "A notification attempt failed (details omitted).",
        occurred_at: row.created_at,
      });
    }
  }

  recent_activity.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  const trimmedActivity = recent_activity.slice(0, 12);

  const next_actions: CustomerProfileNextAction[] = [];
  if (membership.status === "pending") {
    next_actions.push({
      label: "Review standby request",
      href: "/customers/standby-requests",
      priority: "primary",
    });
  }
  if (active_preferences_count === 0 && membership.status === "active") {
    next_actions.push({
      label: "Customer has not finished standby yet",
      href: "/customers",
      priority: "primary",
    });
  }
  if (reachability.status !== "reachable") {
    next_actions.push({
      label: "Improve notification reachability",
      href: "/customers",
      priority: "secondary",
    });
  }
  next_actions.push({ label: "Back to customers", href: "/customers", priority: "secondary" });

  const contact_email = c.email?.trim() ? c.email.trim() : null;
  const contact_phone = c.phone?.trim() ? c.phone.trim() : null;
  const suggested_action = followUpSuggestedAction(membership);
  const follow_up: CustomerProfileFollowUp = {
    contact_email,
    contact_phone,
    can_email: Boolean(contact_email),
    can_call: Boolean(contact_phone),
    suggested_action,
  };

  return {
    customer: {
      id: c.id,
      display_name: displayName,
      email: emailOut,
      phone: phoneOut,
      created_at: c.created_at,
    },
    membership,
    follow_up,
    standby: {
      active_preferences_count,
      services: [...serviceMap.entries()].map(([id, name]) => ({ id, name })),
      locations: [...locMap.entries()].map(([id, name]) => ({ id, name })),
      notice_summary,
      availability_summary,
    },
    reachability,
    claims: { total, confirmed, waiting, expired_or_missed },
    recent_activity: trimmedActivity,
    notification_delivery: { sent_30d, failed_30d, skipped_30d },
    next_actions,
  };
}
