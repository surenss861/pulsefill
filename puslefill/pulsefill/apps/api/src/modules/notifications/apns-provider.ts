import { createSign } from "node:crypto";
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

const APNS_HOSTS: Record<ApnsEnvironment, string> = {
  sandbox: "https://api.sandbox.push.apple.com",
  production: "https://api.push.apple.com",
};

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const NON_RETRYABLE_STATUSES = new Set([400, 403, 410]);

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createApnsJwt(input: {
  teamId: string;
  keyId: string;
  privateKey: string;
  issuedAtSeconds: number;
}): string {
  const header = { alg: "ES256", kid: input.keyId };
  const claims = { iss: input.teamId, iat: input.issuedAtSeconds };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaims = base64url(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const signature = createSign("sha256").update(signingInput).end().sign(input.privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

function normalizeApnsReason(value: string | undefined, fallbackStatus: number): string {
  const reason = (value ?? "").trim().toLowerCase();
  if (!reason) return `apns_status_${fallbackStatus}`;
  return `apns_${reason.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

function mapFailure(args: {
  status: number;
  nowIso: string;
  reason?: string;
  message?: string;
}): PushProviderResult {
  const retryable = RETRYABLE_STATUSES.has(args.status)
    ? true
    : NON_RETRYABLE_STATUSES.has(args.status)
      ? false
      : false;

  return {
    ok: false,
    provider: "apns",
    error_code: normalizeApnsReason(args.reason, args.status),
    error_message:
      args.message?.trim() ||
      args.reason?.trim() ||
      `APNs request failed with status ${args.status}.`,
    failed_at: args.nowIso,
    retryable,
  };
}

export function createApnsPushProvider(
  config: ApnsProviderConfig,
  deps: ApnsProviderDeps = {},
): PushProviderAdapter {
  const httpClient: ApnsHttpClient =
    deps.httpClient ??
    (async (url, init) => {
      const response = await fetch(url, init);
      return response;
    });
  const nowIso = deps.nowIso ?? (() => new Date().toISOString());
  const host = APNS_HOSTS[config.environment];

  return {
    async send(input: {
      payload: PulseFillPushPayload;
      device_token: string;
      dedupe_key: string;
    }): Promise<PushProviderResult> {
      const sentAtIso = nowIso();
      const issuedAtSeconds = Math.floor(Date.parse(sentAtIso) / 1000);
      const jwt = createApnsJwt({
        teamId: config.teamId,
        keyId: config.keyId,
        privateKey: config.privateKey,
        issuedAtSeconds: Number.isFinite(issuedAtSeconds) ? issuedAtSeconds : Math.floor(Date.now() / 1000),
      });

      const url = `${host}/3/device/${encodeURIComponent(input.device_token)}`;
      const body = JSON.stringify({
        aps: {
          alert: {
            title: input.payload.title,
            body: input.payload.body,
          },
          sound: "default",
        },
        type: input.payload.type,
        deep_link: input.payload.deep_link,
        dedupe_key: input.payload.dedupe_key,
      });

      try {
        const response = await httpClient(url, {
          method: "POST",
          headers: {
            authorization: `bearer ${jwt}`,
            "apns-topic": config.bundleId,
            "apns-push-type": "alert",
            "apns-priority": "10",
            "apns-collapse-id": input.dedupe_key,
            "content-type": "application/json",
          },
          body,
        });

        if (response.status === 200) {
          const apnsId = response.headers?.get("apns-id") ?? `apns-${Date.now()}`;
          return {
            ok: true,
            provider: "apns",
            provider_message_id: apnsId,
            sent_at: sentAtIso,
          };
        }

        const text = await response.text();
        let reason: string | undefined;
        let message: string | undefined;
        if (text) {
          try {
            const parsed = JSON.parse(text) as { reason?: string };
            reason = parsed.reason;
            message = parsed.reason ? `APNs rejected notification: ${parsed.reason}` : text;
          } catch {
            message = text;
          }
        }

        return mapFailure({
          status: response.status,
          nowIso: nowIso(),
          reason,
          message,
        });
      } catch (error) {
        return {
          ok: false,
          provider: "apns",
          error_code: "apns_network_error",
          error_message: error instanceof Error ? error.message : "APNs network error.",
          failed_at: nowIso(),
          retryable: true,
        };
      }
    },
  };
}
