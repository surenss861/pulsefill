import { createHash } from "node:crypto";
import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { User } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";
import { createServiceSupabase } from "../config/supabase.js";

type AuthOpts = { env: Env };

// Short-TTL cache so a burst of requests from the same session doesn't cost a
// Supabase network round-trip per request. TTL is short (60s) to keep the
// blast radius of a revoked token small; keys are hashed (not raw tokens) so
// a heap snapshot doesn't directly expose live bearer tokens.
const TOKEN_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_MAX_ENTRIES = 5000;

type TokenCacheEntry = { user: User | null; expiresAt: number };

const tokenCache = new Map<string, TokenCacheEntry>();

function tokenCacheKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getCachedAuthUser(token: string): TokenCacheEntry | undefined {
  const key = tokenCacheKey(token);
  const entry = tokenCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    tokenCache.delete(key);
    return undefined;
  }
  return entry;
}

function setCachedAuthUser(token: string, user: User | null): void {
  const key = tokenCacheKey(token);
  if (!tokenCache.has(key) && tokenCache.size >= TOKEN_CACHE_MAX_ENTRIES) {
    const oldestKey = tokenCache.keys().next().value;
    if (oldestKey) tokenCache.delete(oldestKey);
  }
  tokenCache.set(key, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
}

export default fp<AuthOpts>(async (app: FastifyInstance, opts: AuthOpts) => {
  const admin = createServiceSupabase(opts.env);

  app.addHook("preHandler", async (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return;
    const token = header.slice("Bearer ".length).trim();
    if (!token) return;

    if (process.env.PULSEFILL_API_TEST === "1" && token === "test-token") {
      const id =
        process.env.PULSEFILL_TEST_AUTH_USER_ID ?? "44444444-4444-4444-8444-444444444444";
      req.authUser = {
        id,
        email: "operator-route-test@pulsefill.invalid",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User;
      return;
    }

    const cached = getCachedAuthUser(token);
    if (cached) {
      if (cached.user) req.authUser = cached.user;
      return;
    }

    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      setCachedAuthUser(token, null);
      return;
    }
    req.authUser = data.user;
    setCachedAuthUser(token, data.user);
  });
});
