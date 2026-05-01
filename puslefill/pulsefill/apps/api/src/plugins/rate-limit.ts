import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { Redis } from "ioredis";
import type { Env } from "../config/env.js";

type RateLimitOpts = { env: Env };

function rateLimitKey(req: FastifyRequest): string {
  const uid = req.authUser?.id;
  if (uid) return `u:${uid}`;
  const xf = req.headers["x-forwarded-for"];
  const raw = typeof xf === "string" ? xf.split(",")[0]?.trim() : undefined;
  return `ip:${raw ?? req.socket.remoteAddress ?? "unknown"}`;
}

function isHealthPath(req: FastifyRequest): boolean {
  const path = (req.url ?? "").split("?")[0] ?? "";
  return path === "/health" || path === "/ready";
}

/** Stricter caps for high-abuse or high-cost mutations (merged with global by @fastify/rate-limit). */
export const rateLimitTier = {
  /** Claim opening, invite accept, standby intent submit */
  strict: { max: 24, timeWindow: 10 * 60 * 1000 } as const,
  /** Send offers, confirm booking, create opening, bulk slot actions */
  staffAction: { max: 42, timeWindow: 5 * 60 * 1000 } as const,
  /** Standby preference save */
  preferenceSave: { max: 72, timeWindow: 10 * 60 * 1000 } as const,
  /** Authenticated directory reads */
  directoryRead: { max: 120, timeWindow: 10 * 60 * 1000 } as const,
};

export default fp<RateLimitOpts>(async (app: FastifyInstance, opts: RateLimitOpts) => {
  if (opts.env.RATE_LIMIT_DISABLED) {
    return;
  }

  const redisUrl = opts.env.REDIS_URL?.trim();
  let redis: Redis | undefined;
  if (redisUrl) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
    app.log.info("Rate limits use Redis (shared counters across API instances).");
    app.addHook("onClose", async () => {
      await redis?.quit().catch(() => undefined);
    });
  }

  await app.register(rateLimit, {
    global: true,
    hook: "preHandler",
    max: 360,
    timeWindow: 5 * 60 * 1000,
    allowList: (req) => isHealthPath(req),
    keyGenerator: rateLimitKey,
    ...(redis
      ? {
          redis,
          nameSpace: "pulsefill-api-rate:",
          /** If Redis is unreachable, allow the request rather than failing every handler. */
          skipOnError: true,
        }
      : {}),
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: "rate_limited",
      message: `Too many attempts. Try again in ${context.after}.`,
      request_id: request.requestId,
    }),
  });
});
