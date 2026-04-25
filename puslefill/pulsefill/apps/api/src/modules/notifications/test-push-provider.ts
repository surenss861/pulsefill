import type { PulseFillPushPayload } from "./push-payloads.js";
import type { PushProviderResult } from "./provider-result.js";

export type PushProviderAdapter = {
  send(input: {
    payload: PulseFillPushPayload;
    device_token: string;
    dedupe_key: string;
  }): Promise<PushProviderResult>;
};

export function createTestPushProvider(input?: {
  mode?: "success" | "failure";
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  nowIso?: string;
}): PushProviderAdapter {
  const mode = input?.mode ?? "success";
  const nowIso = input?.nowIso ?? new Date().toISOString();

  return {
    async send() {
      if (mode === "failure") {
        return {
          ok: false,
          provider: "test",
          error_code: input?.errorCode ?? "TEST_PROVIDER_FAILURE",
          error_message: input?.errorMessage ?? "Test provider simulated failure.",
          failed_at: nowIso,
          retryable: true,
        };
      }

      return {
        ok: true,
        provider: "test",
        provider_message_id: input?.messageId ?? `test-msg-${Date.now()}`,
        sent_at: nowIso,
      };
    },
  };
}
