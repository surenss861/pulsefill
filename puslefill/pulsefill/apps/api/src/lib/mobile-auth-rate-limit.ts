import { createHash } from "node:crypto";
import { Redis } from "ioredis";
import type { Env } from "../config/env.js";

export type MobileAuthRateAction =
  | "sign-in"
  | "sign-up"
  | "password-reset"
  | "refresh"
  | "dashboard-sign-up-business";

const WINDOW_SEC = 15 * 60;
const LIMITS: Record<MobileAuthRateAction, number> = {
  "sign-in": 32,
  "sign-up": 16,
  "password-reset": 12,
  refresh: 48,
  "dashboard-sign-up-business": 16,
};

type MemEntry = { count: number; resetAtMs: number };
const memoryBuckets = new Map<string, MemEntry>();

let sharedRedis: Redis | undefined;
let sharedRedisUrl: string | undefined;

function getSharedRedis(url: string): Redis {
  if (sharedRedis && sharedRedisUrl === url) return sharedRedis;
  sharedRedis?.disconnect();
  sharedRedisUrl = url;
  sharedRedis = new Redis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    /** If Redis is down, fail open (same spirit as global rate-limit plugin). */
    lazyConnect: true,
  });
  return sharedRedis;
}

function compositeFingerprint(ip: string, emailLower: string, deviceId?: string): string {
  const d = (deviceId ?? "").trim().slice(0, 128);
  return createHash("sha256")
    .update(`${ip}|${emailLower}|${d}`)
    .digest("hex")
    .slice(0, 40);
}

export function clientIpFromRequest(req: {
  headers: Record<string, unknown>;
  socket: { remoteAddress?: string | null };
}): string {
  const xf = req.headers["x-forwarded-for"];
  const raw = typeof xf === "string" ? xf.split(",")[0]?.trim() : undefined;
  return raw ?? req.socket.remoteAddress ?? "unknown";
}

/**
 * Returns `limited` when over limit. Uses Redis when `REDIS_URL` is set (one shared client per process);
 * otherwise a bounded in-memory counter (single-instance only).
 * Skips when `RATE_LIMIT_DISABLED` is true.
 */
export async function assertMobileAuthRateLimit(
  env: Env,
  action: MobileAuthRateAction,
  req: { headers: Record<string, unknown>; socket: { remoteAddress?: string | null } },
  emailNormalized: string,
  deviceId?: string,
): Promise<"ok" | "limited"> {
  if (env.RATE_LIMIT_DISABLED) return "ok";

  const ip = clientIpFromRequest(req);
  const fp = compositeFingerprint(ip, emailNormalized, deviceId);
  const max = LIMITS[action];
  const key = `pulsefill:mobile-auth:${action}:${fp}`;

  const redisUrl = env.REDIS_URL?.trim();
  if (redisUrl) {
    try {
      const redis = getSharedRedis(redisUrl);
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, WINDOW_SEC);
      if (n > max) return "limited";
    } catch {
      // Fail open
    }
    return "ok";
  }

  const now = Date.now();
  const resetAtMs = now + WINDOW_SEC * 1000;
  const prev = memoryBuckets.get(key);
  if (!prev || prev.resetAtMs <= now) {
    memoryBuckets.set(key, { count: 1, resetAtMs });
    return "ok";
  }
  prev.count += 1;
  if (prev.count > max) return "limited";
  return "ok";
}
