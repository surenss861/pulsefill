import type { Env } from "./env.js";

/**
 * Fails fast on boot in `NODE_ENV=production` when required prod combinations are missing.
 * Development / test are unchanged.
 */
export function assertProductionStartup(env: Env): void {
  if (env.NODE_ENV !== "production") return;

  const problems: string[] = [];

  try {
    const u = new URL(env.SUPABASE_URL);
    if (u.protocol !== "https:") {
      problems.push("SUPABASE_URL must use https in production.");
    }
  } catch {
    problems.push("SUPABASE_URL is not a valid URL.");
  }

  if (!env.API_CORS_ORIGINS?.length) {
    problems.push(
      "API_CORS_ORIGINS must be set in production (comma-separated origins, e.g. https://app.example.com).",
    );
  }

  if (env.ENABLE_BILLING_ROUTES) {
    if (!env.STRIPE_SECRET_KEY?.trim()) {
      problems.push("ENABLE_BILLING_ROUTES is on but STRIPE_SECRET_KEY is missing.");
    }
    if (!env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim()) {
      problems.push("ENABLE_BILLING_ROUTES is on but STRIPE_SUBSCRIPTION_PRICE_ID is missing.");
    }
    if (!env.DASHBOARD_URL?.trim()) {
      problems.push("ENABLE_BILLING_ROUTES is on but DASHBOARD_URL is missing.");
    }
  }

  if (env.ENABLE_STRIPE_WEBHOOK_ROUTES && !env.STRIPE_WEBHOOK_SECRET?.trim()) {
    problems.push("ENABLE_STRIPE_WEBHOOK_ROUTES is on but STRIPE_WEBHOOK_SECRET is missing.");
  }

  if (problems.length > 0) {
    throw new Error(`Production configuration invalid:\n- ${problems.join("\n- ")}`);
  }
}
