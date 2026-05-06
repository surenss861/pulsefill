import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Env } from "../../config/env.js";
import { computeReachabilityLevel } from "../businesses/customer-profile.js";
import { hashInviteToken, normalizeEmailForInvite } from "./invite-token.js";

export type StaffCustomerInviteRow = {
  id: string;
  email: string;
  customer_name: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  accepted_by_customer_id: string | null;
  /** Present while pending (and for new rows); null after accept/revoke or legacy rows. */
  invite_token: string | null;
};

export type InviteOnboardingStatusKey =
  | "pending_invite"
  | "accepted_connection_issue"
  | "accepted_needs_standby"
  | "accepted_not_reachable"
  | "accepted_limited_reach"
  | "accepted_standby_active"
  | "expired"
  | "revoked";

export type InviteOnboardingStatus = {
  key: InviteOnboardingStatusKey;
  label: string;
  detail: string;
  tone: "neutral" | "attention" | "success" | "warning" | "muted";
  next_action?: { label: string; href: string };
};

export type StaffCustomerInviteListItem = {
  id: string;
  code: string | null;
  invite_url: string | null;
  customer_name: string | null;
  customer_email: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  accepted_by_customer_id: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  onboarding_status: InviteOnboardingStatus;
};

export type StaffCustomerInviteCreateResponse = StaffCustomerInviteListItem & {
  /** Same value as `code` (magic-link token). */
  one_time_token: string;
  expires_in_days: number;
};

export type StaffCustomerInviteListResponse = {
  invites: StaffCustomerInviteListItem[];
};

export function buildInviteUrl(base: string | undefined, token: string): string | null {
  if (!base?.trim()) return null;
  const b = base.replace(/\/$/, "");
  return `${b}/invite?token=${encodeURIComponent(token)}`;
}

type LoadedAcceptedContext = {
  membership: Map<string, { status: string }>;
  activePrefCount: Map<string, number>;
  reachability: Map<string, "reachable" | "limited" | "unreachable">;
  customerExists: Set<string>;
};

async function loadAcceptedInviteContext(
  admin: SupabaseClient,
  businessId: string,
  customerIds: string[],
): Promise<LoadedAcceptedContext> {
  const empty: LoadedAcceptedContext = {
    membership: new Map(),
    activePrefCount: new Map(),
    reachability: new Map(),
    customerExists: new Set(),
  };
  if (customerIds.length === 0) return empty;

  const [{ data: memRows, error: memErr }, { data: prefRows, error: prefErr }, { data: custRows, error: custErr }, { data: pushRows, error: pushErr }] =
    await Promise.all([
      admin
        .from("customer_business_memberships")
        .select("customer_id, status")
        .eq("business_id", businessId)
        .in("customer_id", customerIds),
      admin
        .from("standby_preferences")
        .select("customer_id")
        .eq("business_id", businessId)
        .eq("active", true)
        .in("customer_id", customerIds),
      admin
        .from("customers")
        .select("id, email, phone, push_enabled, sms_enabled, email_enabled")
        .in("id", customerIds),
      admin
        .from("customer_push_devices")
        .select("customer_id")
        .eq("active", true)
        .eq("platform", "ios")
        .eq("token_type", "apns")
        .in("customer_id", customerIds),
    ]);

  if (memErr) throw new Error("list_failed");
  if (prefErr) throw new Error("list_failed");
  if (custErr) throw new Error("list_failed");
  if (pushErr) throw new Error("list_failed");

  const membership = new Map<string, { status: string }>();
  for (const r of memRows ?? []) {
    const row = r as { customer_id: string; status: string };
    membership.set(row.customer_id, { status: row.status });
  }

  const activePrefCount = new Map<string, number>();
  for (const r of prefRows ?? []) {
    const cid = (r as { customer_id: string }).customer_id;
    activePrefCount.set(cid, (activePrefCount.get(cid) ?? 0) + 1);
  }

  const customerExists = new Set<string>();
  const custById = new Map<
    string,
    {
      id: string;
      email: string | null;
      phone: string | null;
      push_enabled: boolean;
      sms_enabled: boolean;
      email_enabled: boolean;
    }
  >();
  for (const r of custRows ?? []) {
    const c = r as {
      id: string;
      email: string | null;
      phone: string | null;
      push_enabled: boolean;
      sms_enabled: boolean;
      email_enabled: boolean;
    };
    customerExists.add(c.id);
    custById.set(c.id, c);
  }

  const pushCount = new Map<string, number>();
  for (const r of pushRows ?? []) {
    const cid = (r as { customer_id: string }).customer_id;
    pushCount.set(cid, (pushCount.get(cid) ?? 0) + 1);
  }

  const reachability = new Map<string, "reachable" | "limited" | "unreachable">();
  for (const cid of customerIds) {
    const c = custById.get(cid);
    if (!c) continue;
    const active_push_devices = pushCount.get(cid) ?? 0;
    const has_email = Boolean(c.email?.trim());
    const has_sms = Boolean(c.phone?.trim());
    reachability.set(
      cid,
      computeReachabilityLevel({
        push_enabled: Boolean(c.push_enabled),
        active_push_devices,
        email_enabled: Boolean(c.email_enabled),
        sms_enabled: Boolean(c.sms_enabled),
        has_email,
        has_sms,
      }),
    );
  }

  return { membership, activePrefCount, reachability, customerExists };
}

export function deriveInviteOnboardingStatus(
  row: StaffCustomerInviteRow,
  ctx: LoadedAcceptedContext | null,
): InviteOnboardingStatus {
  const status = row.status as StaffCustomerInviteListItem["status"];
  if (status === "pending") {
    return {
      key: "pending_invite",
      label: "Pending invite",
      detail: "Customer has not accepted this invite yet.",
      tone: "neutral",
      next_action: { label: "Copy invite link", href: "/customers" },
    };
  }
  if (status === "expired") {
    return {
      key: "expired",
      label: "Expired",
      detail: "Create a new invite if this customer still needs access.",
      tone: "muted",
      next_action: { label: "Create new invite", href: "/customers#invite-customer" },
    };
  }
  if (status === "revoked") {
    return {
      key: "revoked",
      label: "Revoked",
      detail: "This invite can no longer be used.",
      tone: "muted",
      next_action: { label: "Create new invite", href: "/customers#invite-customer" },
    };
  }

  // accepted
  const cid = row.accepted_by_customer_id;
  if (!cid) {
    return {
      key: "accepted_connection_issue",
      label: "Accepted — connection issue",
      detail: "Invite was accepted, but no linked customer profile was found.",
      tone: "attention",
      next_action: { label: "Invite customer", href: "/customers#invite-customer" },
    };
  }

  if (!ctx || !ctx.customerExists.has(cid)) {
    return {
      key: "accepted_connection_issue",
      label: "Accepted — connection issue",
      detail: "Invite was accepted, but no linked customer profile was found.",
      tone: "attention",
      next_action: { label: "Invite customer", href: "/customers#invite-customer" },
    };
  }

  const mem = ctx.membership.get(cid);
  const hasActiveMembership = mem != null && mem.status !== "revoked";
  if (!hasActiveMembership) {
    return {
      key: "accepted_connection_issue",
      label: "Accepted — connection issue",
      detail: "Customer is not actively connected to this business.",
      tone: "attention",
      next_action: { label: "Review customer list", href: "/customers" },
    };
  }

  const prefs = ctx.activePrefCount.get(cid) ?? 0;
  if (prefs === 0) {
    return {
      key: "accepted_needs_standby",
      label: "Accepted — needs standby setup",
      detail: "Customer is connected but has not chosen which openings they want.",
      tone: "attention",
      next_action: { label: "View customer", href: `/customers/${cid}` },
    };
  }

  const reach = ctx.reachability.get(cid) ?? "unreachable";
  if (reach === "unreachable") {
    return {
      key: "accepted_not_reachable",
      label: "Accepted — not reachable",
      detail: "Customer is on standby, but PulseFill may not be able to alert them.",
      tone: "warning",
      next_action: { label: "View customer", href: `/customers/${cid}` },
    };
  }
  if (reach === "limited") {
    return {
      key: "accepted_limited_reach",
      label: "Accepted — limited reach",
      detail: "Customer is on standby, but some alert channels are missing.",
      tone: "warning",
      next_action: { label: "View customer", href: `/customers/${cid}` },
    };
  }
  return {
    key: "accepted_standby_active",
    label: "Accepted — standby active",
    detail: "Customer is connected, on standby, and reachable.",
    tone: "success",
    next_action: { label: "View customer", href: `/customers/${cid}` },
  };
}

function mapListItem(
  row: StaffCustomerInviteRow,
  env: Env,
  onboarding_status: InviteOnboardingStatus,
): StaffCustomerInviteListItem {
  const status = row.status as StaffCustomerInviteListItem["status"];
  const code = row.status === "pending" && row.invite_token ? row.invite_token : null;
  const invite_url =
    row.status === "pending" && row.invite_token ? buildInviteUrl(env.CUSTOMER_APP_BASE_URL, row.invite_token) : null;
  return {
    id: row.id,
    code,
    invite_url,
    customer_name: row.customer_name ?? null,
    customer_email: row.email,
    status,
    accepted_by_customer_id: row.accepted_by_customer_id ?? null,
    created_at: row.created_at,
    expires_at: row.expires_at,
    accepted_at: row.accepted_at ?? null,
    onboarding_status,
  };
}

let listInvitesTestDelegate: null | ((args: { businessId: string }) => Promise<StaffCustomerInviteListResponse>) = null;
let createInviteTestDelegate:
  | null
  | ((args: {
      businessId: string;
      staffId: string;
      email: string;
      customerName: string | null;
      env: Env;
    }) => Promise<StaffCustomerInviteCreateResponse>) = null;
let revokeInviteTestDelegate:
  | null
  | ((args: { businessId: string; inviteId: string }) => Promise<StaffCustomerInviteListItem | null>) = null;

export function setListStaffCustomerInvitesTestDelegate(
  d: ((args: { businessId: string }) => Promise<StaffCustomerInviteListResponse>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("list staff invites test delegate only when PULSEFILL_API_TEST=1");
  }
  listInvitesTestDelegate = d;
}

export function setCreateStaffCustomerInviteTestDelegate(
  d:
    | ((args: {
        businessId: string;
        staffId: string;
        email: string;
        customerName: string | null;
        env: Env;
      }) => Promise<StaffCustomerInviteCreateResponse>)
    | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("create staff invite test delegate only when PULSEFILL_API_TEST=1");
  }
  createInviteTestDelegate = d;
}

export function setRevokeStaffCustomerInviteTestDelegate(
  d: ((args: { businessId: string; inviteId: string }) => Promise<StaffCustomerInviteListItem | null>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("revoke staff invite test delegate only when PULSEFILL_API_TEST=1");
  }
  revokeInviteTestDelegate = d;
}

function isMissingColumnError(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? "").toLowerCase();
  const code = String((error as { code?: string })?.code ?? "");
  return code === "42703" || msg.includes("does not exist") || msg.includes("column");
}

export async function listStaffCustomerInvites(
  admin: SupabaseClient,
  businessId: string,
  env: Env,
): Promise<StaffCustomerInviteListResponse> {
  if (listInvitesTestDelegate) {
    return listInvitesTestDelegate({ businessId });
  }

  const full = await admin
    .from("customer_invites")
    .select(
      "id, email, customer_name, status, expires_at, created_at, accepted_at, accepted_by_customer_id, invite_token",
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  let rows: StaffCustomerInviteRow[];
  if (!full.error) {
    rows = (full.data ?? []) as StaffCustomerInviteRow[];
  } else if (isMissingColumnError(full.error)) {
    const legacy = await admin
      .from("customer_invites")
      .select("id, email, status, expires_at, created_at, accepted_at, accepted_by_customer_id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (legacy.error) {
      throw new Error("list_failed");
    }
    rows = ((legacy.data ?? []) as Array<{ id: string; email: string; status: string; expires_at: string; created_at: string; accepted_at: string | null; accepted_by_customer_id: string | null }>).map(
      (r) => ({
        ...r,
        customer_name: null,
        invite_token: null,
      }),
    );
  } else {
    throw new Error("list_failed");
  }

  const acceptedCustomerIds = [
    ...new Set(
      rows.filter((r) => r.status === "accepted" && r.accepted_by_customer_id).map((r) => r.accepted_by_customer_id!),
    ),
  ];
  let acceptedCtx: LoadedAcceptedContext | null = null;
  if (acceptedCustomerIds.length > 0) {
    acceptedCtx = await loadAcceptedInviteContext(admin, businessId, acceptedCustomerIds);
  }

  return {
    invites: rows.map((r) => {
      const rowNorm: StaffCustomerInviteRow = {
        ...r,
        customer_name: r.customer_name ?? null,
        invite_token: r.invite_token ?? null,
      };
      const onboarding_status = deriveInviteOnboardingStatus(rowNorm, acceptedCtx);
      return mapListItem(rowNorm, env, onboarding_status);
    }),
  };
}

export async function createStaffCustomerInvite(
  admin: SupabaseClient,
  businessId: string,
  staffId: string,
  emailRaw: string,
  customerName: string | null,
  env: Env,
): Promise<StaffCustomerInviteCreateResponse> {
  if (createInviteTestDelegate) {
    return createInviteTestDelegate({ businessId, staffId, email: emailRaw, customerName, env });
  }

  const emailNorm = normalizeEmailForInvite(emailRaw);
  const ttlMs = 7 * 24 * 60 * 60 * 1000;
  const expires_at = new Date(Date.now() + ttlMs).toISOString();

  await admin
    .from("customer_invites")
    .update({ status: "expired" })
    .eq("business_id", businessId)
    .eq("email", emailNorm)
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  const token = randomBytes(32).toString("base64url");
  const token_hash = hashInviteToken(token);

  const insertPayloadFull: Record<string, unknown> = {
    business_id: businessId,
    email: emailNorm,
    token_hash,
    invite_token: token,
    status: "pending",
    expires_at,
    created_by_staff_id: staffId,
  };
  if (customerName != null) {
    insertPayloadFull.customer_name = customerName;
  }

  const insertFull = await admin
    .from("customer_invites")
    .insert(insertPayloadFull)
    .select("id, email, customer_name, status, expires_at, created_at, accepted_at, accepted_by_customer_id, invite_token")
    .single();

  let createdRow: StaffCustomerInviteRow;
  if (!insertFull.error && insertFull.data) {
    createdRow = insertFull.data as StaffCustomerInviteRow;
  } else if (insertFull.error && isMissingColumnError(insertFull.error)) {
    const legacyPayload: Record<string, unknown> = {
      business_id: businessId,
      email: emailNorm,
      token_hash,
      status: "pending",
      expires_at,
      created_by_staff_id: staffId,
    };
    const second = await admin
      .from("customer_invites")
      .insert(legacyPayload)
      .select("id, email, status, expires_at, created_at, accepted_at, accepted_by_customer_id")
      .single();
    if (second.error) {
      const code = String((second.error as { code?: string }).code ?? "");
      const message = String((second.error as { message?: string }).message ?? "").toLowerCase();
      if (code === "23505" || message.includes("duplicate key")) {
        throw new Error("duplicate_pending_invite");
      }
      throw new Error("create_failed");
    }
    const lr = second.data as {
      id: string;
      email: string;
      status: string;
      expires_at: string;
      created_at: string;
      accepted_at: string | null;
      accepted_by_customer_id: string | null;
    };
    createdRow = {
      ...lr,
      customer_name: null,
      invite_token: null,
    };
  } else {
    const code = String((insertFull.error as { code?: string })?.code ?? "");
    const message = String((insertFull.error as { message?: string })?.message ?? "").toLowerCase();
    if (code === "23505" || message.includes("duplicate key")) {
      throw new Error("duplicate_pending_invite");
    }
    throw new Error("create_failed");
  }

  const row = createdRow;
  const rowNorm: StaffCustomerInviteRow = {
    ...row,
    customer_name: row.customer_name ?? null,
    invite_token: row.invite_token ?? token,
  };
  const onboarding_status = deriveInviteOnboardingStatus(rowNorm, null);
  const base = mapListItem(rowNorm, env, onboarding_status);
  return {
    ...base,
    code: token,
    one_time_token: token,
    expires_in_days: 7,
  };
}

export async function revokeStaffCustomerInvite(
  admin: SupabaseClient,
  businessId: string,
  inviteId: string,
  env: Env,
): Promise<StaffCustomerInviteListItem | null> {
  if (revokeInviteTestDelegate) {
    return revokeInviteTestDelegate({ businessId, inviteId });
  }

  const fullRev = await admin
    .from("customer_invites")
    .update({ status: "revoked", invite_token: null })
    .eq("id", inviteId)
    .eq("business_id", businessId)
    .eq("status", "pending")
    .select("id, email, customer_name, status, expires_at, created_at, accepted_at, accepted_by_customer_id, invite_token")
    .maybeSingle();

  let revokedRow: StaffCustomerInviteRow | null = null;
  if (!fullRev.error && fullRev.data) {
    revokedRow = fullRev.data as StaffCustomerInviteRow;
  } else if (fullRev.error && isMissingColumnError(fullRev.error)) {
    const legacy = await admin
      .from("customer_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId)
      .eq("business_id", businessId)
      .eq("status", "pending")
      .select("id, email, status, expires_at, created_at, accepted_at, accepted_by_customer_id")
      .maybeSingle();
    if (legacy.error) {
      throw new Error("revoke_failed");
    }
    if (legacy.data) {
      const lr = legacy.data as {
        id: string;
        email: string;
        status: string;
        expires_at: string;
        created_at: string;
        accepted_at: string | null;
        accepted_by_customer_id: string | null;
      };
      revokedRow = { ...lr, customer_name: null, invite_token: null };
    }
  } else if (fullRev.error) {
    throw new Error("revoke_failed");
  }

  if (!revokedRow) return null;
  const row = revokedRow;
  const rowNorm: StaffCustomerInviteRow = {
    ...row,
    customer_name: row.customer_name ?? null,
    invite_token: row.invite_token ?? null,
  };
  const onboarding_status = deriveInviteOnboardingStatus(rowNorm, null);
  return mapListItem(rowNorm, env, onboarding_status);
}
