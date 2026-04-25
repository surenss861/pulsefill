import type { Env } from "../../config/env.js";
import { createApnsPushProvider, type ApnsProviderConfig } from "./apns-provider.js";
import { createNoopPushProvider } from "./noop-push-provider.js";
import type { PushProviderAdapter } from "./test-push-provider.js";

type PushProviderKind = "noop" | "apns";

type ProviderFactoryDeps = {
  createNoopProvider?: () => PushProviderAdapter;
  createApnsProvider?: (config: ApnsProviderConfig) => PushProviderAdapter;
};

function asProviderKind(value: string | undefined): PushProviderKind | "unknown" {
  if (!value) return "noop";
  if (value === "noop") return "noop";
  if (value === "apns") return "apns";
  return "unknown";
}

function readApnsConfig(env: Env): ApnsProviderConfig {
  const teamId = env.APNS_TEAM_ID?.trim() ?? "";
  const keyId = env.APNS_KEY_ID?.trim() ?? "";
  const privateKey = env.APNS_PRIVATE_KEY?.trim() ?? "";
  const bundleId = env.APNS_BUNDLE_ID?.trim() ?? "";
  const environment = env.APNS_ENVIRONMENT ?? "sandbox";

  if (!teamId || !keyId || !privateKey || !bundleId) {
    throw new Error("push_provider_config_invalid:apns");
  }

  return {
    teamId,
    keyId,
    privateKey,
    bundleId,
    environment,
  };
}

export function createPushProviderFromEnv(
  env: Env,
  deps: ProviderFactoryDeps = {},
): PushProviderAdapter {
  const createNoop = deps.createNoopProvider ?? (() => createNoopPushProvider());
  const createApns = deps.createApnsProvider ?? ((config: ApnsProviderConfig) => createApnsPushProvider(config));
  const providerKind = asProviderKind(env.PUSH_PROVIDER);

  if (providerKind === "apns") {
    return createApns(readApnsConfig(env));
  }

  return createNoop();
}
