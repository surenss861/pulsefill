import type { PushProviderAdapter } from "./test-push-provider.js";

export function createNoopPushProvider(nowIso: string = new Date().toISOString()): PushProviderAdapter {
  return {
    async send() {
      return {
        ok: false,
        provider: "test",
        error_code: "NOOP_PROVIDER",
        error_message: "No push provider configured for this environment.",
        failed_at: nowIso,
        retryable: false,
      };
    },
  };
}
