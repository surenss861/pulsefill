import assert from "node:assert/strict";
import test from "node:test";
import type { Env } from "../../config/env.js";
import { createPushProviderFromEnv } from "./provider-factory.js";

function baseEnv(overrides?: Partial<Env>): Env {
  return {
    NODE_ENV: "test",
    PORT: 0,
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SERVICE_ROLE_KEY: "x",
    LOG_LEVEL: "silent",
    REDIS_URL: undefined,
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
    PUSH_PROVIDER: "noop",
    APNS_TEAM_ID: undefined,
    APNS_KEY_ID: undefined,
    APNS_PRIVATE_KEY: undefined,
    APNS_BUNDLE_ID: undefined,
    APNS_ENVIRONMENT: "sandbox",
    ...overrides,
  };
}

test("createPushProviderFromEnv defaults to noop provider", async () => {
  const provider = createPushProviderFromEnv(baseEnv());
  const out = await provider.send({
    payload: {
      type: "customer_standby_status_reminder",
      title: "x",
      body: "x",
      deep_link: "/x",
      dedupe_key: "k",
      created_at: "2026-04-25T00:00:00.000Z",
      business_id: "b",
      data: {},
    },
    device_token: "t",
    dedupe_key: "k",
  });
  assert.equal(out.provider, "test");
});

test("createPushProviderFromEnv returns noop for explicit noop", async () => {
  const provider = createPushProviderFromEnv(baseEnv({ PUSH_PROVIDER: "noop" }));
  const out = await provider.send({
    payload: {
      type: "customer_standby_status_reminder",
      title: "x",
      body: "x",
      deep_link: "/x",
      dedupe_key: "k",
      created_at: "2026-04-25T00:00:00.000Z",
      business_id: "b",
      data: {},
    },
    device_token: "t",
    dedupe_key: "k",
  });
  assert.equal(out.provider, "test");
});

test("createPushProviderFromEnv returns apns provider when configured", async () => {
  let seenConfig: Record<string, string> | null = null;
  const provider = createPushProviderFromEnv(
    baseEnv({
      PUSH_PROVIDER: "apns",
      APNS_TEAM_ID: "TEAM",
      APNS_KEY_ID: "KEY",
      APNS_PRIVATE_KEY: "PRIVATE",
      APNS_BUNDLE_ID: "com.pulsefill.app",
      APNS_ENVIRONMENT: "production",
    }),
    {
      createApnsProvider: (config) => {
        seenConfig = {
          teamId: config.teamId,
          keyId: config.keyId,
          privateKey: config.privateKey,
          bundleId: config.bundleId,
          environment: config.environment,
        };
        return {
          async send() {
            return {
              ok: true as const,
              provider: "apns" as const,
              provider_message_id: "apns_msg_1",
              sent_at: "2026-04-25T12:00:00.000Z",
            };
          },
        };
      },
    },
  );

  const out = await provider.send({
    payload: {
      type: "customer_standby_status_reminder",
      title: "x",
      body: "x",
      deep_link: "/x",
      dedupe_key: "k",
      created_at: "2026-04-25T00:00:00.000Z",
      business_id: "b",
      data: {},
    },
    device_token: "t",
    dedupe_key: "k",
  });
  assert.equal(out.provider, "apns");
  assert.deepEqual(seenConfig, {
    teamId: "TEAM",
    keyId: "KEY",
    privateKey: "PRIVATE",
    bundleId: "com.pulsefill.app",
    environment: "production",
  });
});

test("createPushProviderFromEnv throws stable error for missing APNS config", () => {
  assert.throws(
    () =>
      createPushProviderFromEnv(
        baseEnv({
          PUSH_PROVIDER: "apns",
          APNS_TEAM_ID: "TEAM",
          APNS_KEY_ID: undefined,
          APNS_PRIVATE_KEY: undefined,
          APNS_BUNDLE_ID: "com.pulsefill.app",
        }),
      ),
    /push_provider_config_invalid:apns/,
  );
});

test("createPushProviderFromEnv falls back to noop for unknown provider value", async () => {
  const env = baseEnv();
  const provider = createPushProviderFromEnv({
    ...env,
    PUSH_PROVIDER: "unknown" as Env["PUSH_PROVIDER"],
  });
  const out = await provider.send({
    payload: {
      type: "customer_standby_status_reminder",
      title: "x",
      body: "x",
      deep_link: "/x",
      dedupe_key: "k",
      created_at: "2026-04-25T00:00:00.000Z",
      business_id: "b",
      data: {},
    },
    device_token: "t",
    dedupe_key: "k",
  });
  assert.equal(out.provider, "test");
});
