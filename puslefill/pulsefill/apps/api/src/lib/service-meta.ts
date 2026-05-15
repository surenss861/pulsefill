import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Env } from "../config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Semver from `apps/api/package.json` (for `/health`, `/ready`). */
export function readApiPackageVersion(): string {
  try {
    const path = join(__dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(path, "utf8")) as { version?: string };
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/** Short deploy revision when the host sets a common CI / PaaS env var. */
export function readDeploymentRevision(): string | undefined {
  const raw =
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.COMMIT_SHA;
  const s = raw?.trim();
  if (!s) return undefined;
  return s.length > 12 ? s.slice(0, 12) : s;
}

export function supabaseHostFromEnv(env: Env): string {
  try {
    return new URL(env.SUPABASE_URL).host;
  } catch {
    return "invalid";
  }
}

export function stripeCheckoutConfigured(env: Env): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY?.trim() &&
      env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim() &&
      env.DASHBOARD_URL?.trim(),
  );
}

export function stripeWebhookConfigured(env: Env): boolean {
  return Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());
}

/** Non-secret surface for readiness / ops (safe to expose on `/ready`). */
export function publicServiceSurface(env: Env) {
  const revision = readDeploymentRevision();
  return {
    service: "@pulsefill/api",
    version: readApiPackageVersion(),
    ...(revision ? { revision } : {}),
    node_env: env.NODE_ENV,
    time: new Date().toISOString(),
    supabase_host: supabaseHostFromEnv(env),
    billing_routes_enabled: env.ENABLE_BILLING_ROUTES,
    stripe_checkout_configured: stripeCheckoutConfigured(env),
    stripe_webhook_routes_enabled: env.ENABLE_STRIPE_WEBHOOK_ROUTES,
    stripe_webhook_secret_configured: stripeWebhookConfigured(env),
    apns_environment: env.APNS_ENVIRONMENT,
    apns_configured: Boolean(
      env.APNS_TEAM_ID && env.APNS_KEY_ID && env.APNS_PRIVATE_KEY && env.APNS_BUNDLE_ID,
    ),
  };
}
