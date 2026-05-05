import { createSign } from "node:crypto";

export type ApnsHttpEnvironment = "sandbox" | "production";

export type ApnsHttpConfig = {
  teamId: string;
  keyId: string;
  privateKey: string;
  bundleId: string;
  environment: ApnsHttpEnvironment;
};

const APNS_HOSTS: Record<ApnsHttpEnvironment, string> = {
  sandbox: "https://api.sandbox.push.apple.com",
  production: "https://api.push.apple.com",
};

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createApnsJwt(input: {
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

export type ApnsSendBody = Record<string, unknown>;

export type SendApnsPushResult =
  | { ok: true; provider_message_id?: string; sent_at: string }
  | {
      ok: false;
      error_code: string;
      error_message: string;
      failed_at: string;
      retryable: boolean;
    };

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const NON_RETRYABLE_STATUSES = new Set([400, 403, 410]);

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
}): SendApnsPushResult {
  const retryable = RETRYABLE_STATUSES.has(args.status)
    ? true
    : NON_RETRYABLE_STATUSES.has(args.status)
      ? false
      : false;

  return {
    ok: false,
    error_code: normalizeApnsReason(args.reason, args.status),
    error_message:
      args.message?.trim() ||
      args.reason?.trim() ||
      `APNs request failed with status ${args.status}.`,
    failed_at: args.nowIso,
    retryable,
  };
}

/**
 * POST one APNs alert. `body` is the full JSON object (must include `aps`).
 * Uses HTTP/2-capable `fetch` (Node 18+).
 */
export async function sendApnsPush(
  config: ApnsHttpConfig,
  input: {
    deviceToken: string;
    collapseId: string;
    body: ApnsSendBody;
    nowIso?: () => string;
    fetchImpl?: typeof fetch;
  },
): Promise<SendApnsPushResult> {
  const nowIso = input.nowIso ?? (() => new Date().toISOString());
  const sentAtIso = nowIso();
  const issuedAtSeconds = Math.floor(Date.parse(sentAtIso) / 1000);
  const jwt = createApnsJwt({
    teamId: config.teamId,
    keyId: config.keyId,
    privateKey: config.privateKey,
    issuedAtSeconds: Number.isFinite(issuedAtSeconds) ? issuedAtSeconds : Math.floor(Date.now() / 1000),
  });

  const host = APNS_HOSTS[config.environment];
  const url = `${host}/3/device/${encodeURIComponent(input.deviceToken)}`;
  const fetchFn = input.fetchImpl ?? fetch;

  try {
    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": config.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "apns-collapse-id": input.collapseId,
        "content-type": "application/json",
      },
      body: JSON.stringify(input.body),
    });

    if (response.status === 200) {
      const apnsId = response.headers.get("apns-id") ?? `apns-${Date.now()}`;
      return {
        ok: true,
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
      error_code: "apns_network_error",
      error_message: error instanceof Error ? error.message : "APNs network error.",
      failed_at: nowIso(),
      retryable: true,
    };
  }
}
