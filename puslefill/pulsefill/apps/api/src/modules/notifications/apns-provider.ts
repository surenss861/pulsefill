import { sendApnsPush, type ApnsHttpConfig } from "@pulsefill/shared";
import type { PulseFillPushPayload } from "./push-payloads.js";
import type { PushProviderResult } from "./provider-result.js";
import type { PushProviderAdapter } from "./test-push-provider.js";

export type ApnsEnvironment = "sandbox" | "production";

export type ApnsProviderConfig = {
  teamId: string;
  keyId: string;
  privateKey: string;
  bundleId: string;
  environment: ApnsEnvironment;
};

type ApnsHttpResponse = {
  status: number;
  headers?: Headers;
  text(): Promise<string>;
};

type ApnsHttpClient = (
  url: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  },
) => Promise<ApnsHttpResponse>;

type ApnsProviderDeps = {
  httpClient?: ApnsHttpClient;
  nowIso?: () => string;
};

function buildApnsJsonBody(payload: PulseFillPushPayload): Record<string, unknown> {
  return {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: "default",
    },
    ...payload.data,
    type: payload.type,
    deep_link: payload.deep_link,
    dedupe_key: payload.dedupe_key,
  };
}

export function createApnsPushProvider(
  config: ApnsProviderConfig,
  deps: ApnsProviderDeps = {},
): PushProviderAdapter {
  const nowIso = deps.nowIso ?? (() => new Date().toISOString());

  const sharedConfig: ApnsHttpConfig = {
    teamId: config.teamId,
    keyId: config.keyId,
    privateKey: config.privateKey,
    bundleId: config.bundleId,
    environment: config.environment,
  };

  const fetchImpl: typeof fetch | undefined = deps.httpClient
    ? async (input: string | URL | Request, init?: RequestInit) => {
        const u =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
        const headers: Record<string, string> = {};
        if (init?.headers) {
          const h = new Headers(init.headers);
          h.forEach((v, k) => {
            headers[k] = v;
          });
        }
        const res = await deps.httpClient!(u, {
          method: "POST",
          headers,
          body: String(init?.body ?? ""),
        });
        return new Response(await res.text(), { status: res.status, headers: res.headers ?? new Headers() });
      }
    : undefined;

  return {
    async send(input: {
      payload: PulseFillPushPayload;
      device_token: string;
      dedupe_key: string;
    }): Promise<PushProviderResult> {
      const body = buildApnsJsonBody(input.payload);
      const raw = await sendApnsPush(sharedConfig, {
        deviceToken: input.device_token,
        collapseId: input.dedupe_key,
        body,
        nowIso,
        fetchImpl,
      });

      if (raw.ok) {
        return {
          ok: true,
          provider: "apns",
          provider_message_id: raw.provider_message_id ?? `apns-${Date.now()}`,
          sent_at: raw.sent_at,
        };
      }
      return {
        ok: false,
        provider: "apns",
        error_code: raw.error_code,
        error_message: raw.error_message,
        failed_at: raw.failed_at,
        retryable: raw.retryable,
      };
    },
  };
}
