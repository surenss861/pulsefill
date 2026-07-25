import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { Env } from "../../config/env.js";

export type BusinessConnectAccountRow = {
  id: string;
  business_id: string;
  stripe_account_id: string;
  status: "not_started" | "pending" | "enabled" | "restricted" | "disabled";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  disabled_reason: string | null;
  requirements_currently_due: string[];
};

type OnboardingLinkArgs = {
  admin: SupabaseClient;
  stripe: Stripe;
  env: Env;
  businessId: string;
};

let onboardingLinkDelegate: ((args: OnboardingLinkArgs) => Promise<{ url: string }>) | null = null;
let accountStatusRefreshDelegate:
  | ((args: { admin: SupabaseClient; stripe: Stripe; businessId: string }) => Promise<BusinessConnectAccountRow>)
  | null = null;

export function setConnectOnboardingLinkDelegateForTest(
  d: ((args: OnboardingLinkArgs) => Promise<{ url: string }>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("connect onboarding-link test delegate only when PULSEFILL_API_TEST=1");
  }
  onboardingLinkDelegate = d;
}

export function setConnectAccountStatusRefreshDelegateForTest(
  d: ((args: { admin: SupabaseClient; stripe: Stripe; businessId: string }) => Promise<BusinessConnectAccountRow>) | null,
): void {
  if (d != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("connect status refresh test delegate only when PULSEFILL_API_TEST=1");
  }
  accountStatusRefreshDelegate = d;
}

export function resetConnectTestDelegates(): void {
  onboardingLinkDelegate = null;
  accountStatusRefreshDelegate = null;
}

async function loadConnectAccountRow(
  admin: SupabaseClient,
  businessId: string,
): Promise<BusinessConnectAccountRow | null> {
  const { data, error } = await admin
    .from("business_connect_accounts")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw new Error(`connect_account_lookup_failed:${error.message}`);
  return (data as BusinessConnectAccountRow | null) ?? null;
}

async function ensureConnectAccountId(
  admin: SupabaseClient,
  stripe: Stripe,
  businessId: string,
): Promise<string> {
  const existing = await loadConnectAccountRow(admin, businessId);
  if (existing) return existing.stripe_account_id;

  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("name, email")
    .eq("id", businessId)
    .maybeSingle();
  if (bizErr) throw new Error(`connect_business_lookup_failed:${bizErr.message}`);

  const account = await stripe.accounts.create({
    type: "express",
    email: (biz as { email?: string | null } | null)?.email ?? undefined,
    business_profile: {
      name: (biz as { name?: string | null } | null)?.name ?? undefined,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { pulsefill_business_id: businessId },
  });

  const { error: insErr } = await admin.from("business_connect_accounts").insert({
    business_id: businessId,
    stripe_account_id: account.id,
    status: "pending",
  });
  if (insErr) throw new Error(`connect_account_insert_failed:${insErr.message}`);

  return account.id;
}

/** Creates the connected account on first call; always returns a fresh onboarding/refresh link. */
export async function createConnectOnboardingLink(args: OnboardingLinkArgs): Promise<{ url: string }> {
  if (onboardingLinkDelegate) return onboardingLinkDelegate(args);

  const { admin, stripe, env, businessId } = args;
  const base = env.DASHBOARD_URL?.trim();
  if (!base) throw new Error("connect_missing_dashboard_url");

  const accountId = await ensureConnectAccountId(admin, stripe, businessId);

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${base}/billing/payouts?refresh=1`,
    return_url: `${base}/billing/payouts?onboarding=complete`,
  });

  const expiresAt = link.expires_at ? new Date(link.expires_at * 1000).toISOString() : null;
  await admin
    .from("business_connect_accounts")
    .update({ onboarding_link_expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq("business_id", businessId);

  return { url: link.url };
}

function deriveConnectStatus(account: Stripe.Account): BusinessConnectAccountRow["status"] {
  if (account.charges_enabled && account.payouts_enabled) return "enabled";
  if (account.requirements?.disabled_reason) return "disabled";
  if (account.details_submitted) return "restricted";
  return "pending";
}

/** Re-fetches live status from Stripe and persists it (called from the status route + webhooks). */
export async function refreshConnectAccountStatus(args: {
  admin: SupabaseClient;
  stripe: Stripe;
  businessId: string;
}): Promise<BusinessConnectAccountRow> {
  if (accountStatusRefreshDelegate) return accountStatusRefreshDelegate(args);

  const { admin, stripe, businessId } = args;
  const existing = await loadConnectAccountRow(admin, businessId);
  if (!existing) {
    return {
      id: "",
      business_id: businessId,
      stripe_account_id: "",
      status: "not_started",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      disabled_reason: null,
      requirements_currently_due: [],
    };
  }

  const account = await stripe.accounts.retrieve(existing.stripe_account_id);
  const status = deriveConnectStatus(account);
  const requirementsCurrentlyDue = account.requirements?.currently_due ?? [];
  const disabledReason = account.requirements?.disabled_reason ?? null;

  const patch = {
    status,
    charges_enabled: Boolean(account.charges_enabled),
    payouts_enabled: Boolean(account.payouts_enabled),
    details_submitted: Boolean(account.details_submitted),
    disabled_reason: disabledReason,
    requirements_currently_due: requirementsCurrentlyDue,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("business_connect_accounts").update(patch).eq("business_id", businessId);
  if (error) throw new Error(`connect_account_update_failed:${error.message}`);

  return { ...existing, ...patch };
}

/** Fast path for GET status: read the cached row without a Stripe round-trip. */
export async function getConnectAccountSnapshot(
  admin: SupabaseClient,
  businessId: string,
): Promise<BusinessConnectAccountRow> {
  const existing = await loadConnectAccountRow(admin, businessId);
  return (
    existing ?? {
      id: "",
      business_id: businessId,
      stripe_account_id: "",
      status: "not_started",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      disabled_reason: null,
      requirements_currently_due: [],
    }
  );
}

/** Applies an `account.updated` webhook payload directly, without an extra Stripe round-trip. */
export async function applyConnectAccountUpdateFromWebhook(
  admin: SupabaseClient,
  account: Stripe.Account,
): Promise<void> {
  const status = deriveConnectStatus(account);
  const { error } = await admin
    .from("business_connect_accounts")
    .update({
      status,
      charges_enabled: Boolean(account.charges_enabled),
      payouts_enabled: Boolean(account.payouts_enabled),
      details_submitted: Boolean(account.details_submitted),
      disabled_reason: account.requirements?.disabled_reason ?? null,
      requirements_currently_due: account.requirements?.currently_due ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id);
  if (error) throw new Error(`connect_account_webhook_update_failed:${error.message}`);
}

/** Resolves a business's connect account row by Stripe account id (webhook dispatch). */
export async function loadConnectAccountByStripeId(
  admin: SupabaseClient,
  stripeAccountId: string,
): Promise<BusinessConnectAccountRow | null> {
  const { data, error } = await admin
    .from("business_connect_accounts")
    .select("*")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();
  if (error) throw new Error(`connect_account_lookup_by_stripe_id_failed:${error.message}`);
  return (data as BusinessConnectAccountRow | null) ?? null;
}
