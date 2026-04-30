import type { Env } from "../../config/env.js";

/** Valid `Env` for route tests (no real Supabase calls on the paths we exercise). */
export function createTestEnv(): Env {
  return {
    NODE_ENV: "test",
    PORT: 0,
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-placeholder",
      LOG_LEVEL: "silent",
      API_CORS_ORIGINS: undefined,
      REDIS_URL: undefined,
      STRIPE_SECRET_KEY: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      ENABLE_BILLING_ROUTES: false,
      ENABLE_STRIPE_WEBHOOK_ROUTES: false,
      PUSH_PROVIDER: "noop",
    APNS_TEAM_ID: undefined,
    APNS_KEY_ID: undefined,
    APNS_PRIVATE_KEY: undefined,
    APNS_BUNDLE_ID: undefined,
    APNS_ENVIRONMENT: "sandbox",
  };
}
