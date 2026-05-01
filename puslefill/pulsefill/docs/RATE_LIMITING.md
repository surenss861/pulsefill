# Rate limiting plan (PulseFill API)

**Status:** **Implemented** in `apps/api/src/plugins/rate-limit.ts` using `@fastify/rate-limit`, registered from `app.ts` after auth. Global baseline applies to all routes except `/health` and `/ready` (allowlist). Stricter `config.rateLimit` is set on sensitive routes (see `rateLimitTier` in the same file). API tests set `RATE_LIMIT_DISABLED: true` in `createTestEnv()` so limits do not interfere with route tests.

**Redis (production / multi-instance):** When `REDIS_URL` is set, the plugin uses the same ioredis client style as `@fastify/rate-limit`’s `RedisStore`, so counters are shared across API replicas (`nameSpace`: `pulsefill-api-rate:`). If Redis is unreachable, `skipOnError: true` allows the request through (fail-open for availability; monitor Redis health). When `REDIS_URL` is unset, limits stay in-memory (fine for a single local process).

**Contract test:** `apps/api/src/test/rate-limit-contract.test.ts` (isolated Fastify app) verifies 429 + `rate_limited` shape.

**Production verification:** After each API deploy, confirm limits are on (`RATE_LIMIT_DISABLED` not set) and hit a tiered route until **`429`** returns JSON with **`rate_limited`**, **`message`**, and **`request_id`** (see [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md) §8).

**Why:** Auth-adjacent and high-value endpoints (invite accept, claim, send offers, standby requests) need abuse protection even when Supabase auth is correct.

---

## 1. Principles

- **Layered keys:** combine IP + authenticated user id where a user exists; for anonymous endpoints, IP only with conservative ceilings.
- **Stricter on mutations** than on reads.
- **Idempotency first** for claim / confirm / send-offers; rate limits are a backstop, not the only duplicate guard.
- **Stripe webhooks:** verify signature first; apply modest IP limits only to prevent garbage traffic, not to throttle legitimate Stripe retries.

---

## 2. Suggested tiers

### Tier A — very strict

Apply to unauthenticated or high-abuse endpoints:

- Invite code accept (if unauthenticated or weakly authenticated)
- Password reset request proxies (if any exist on this API)
- Customer signup helpers (if any)

Authenticated but sensitive:

- Claim offer
- Submit standby access request
- Accept invite (token brute-force resistance)

Suggested starting point (tune with metrics): **e.g. 20–60 requests / minute / user** on claim and invite-accept; **lower** for pure IP-bound anonymous routes.

### Tier B — moderate

- Customer directory list/detail (read-heavy)
- Standby preference save
- Staff PATCH business settings

### Tier C — staff business actions

Guarded by auth + `requireStaff`; still limit to prevent operator mistakes and compromised tokens:

- Create opening
- Send offers / retry offers
- Confirm booking
- Approve/decline standby requests

Suggested: **e.g. 30–120 requests / minute / staff user** with separate **per-business** budget if Redis allows composite keys.

### Tier D — light

- `GET /health`
- `GET /ready` (keep generous so orchestrators do not flap)

---

## 3. Fastify integration sketch

1. Register a global rate limit with a high ceiling as a safety net.
2. Register **per-route** `config.rateLimit` (if using `@fastify/rate-limit` route options) for tiers A–C.
3. **Done:** Redis store when `REDIS_URL` is set (same variable as BullMQ / worker queue).

Return **429** with a stable JSON body, for example:

```json
{
  "error": "rate_limited",
  "message": "Too many requests. Try again in a moment."
}
```

Include `Retry-After` when the plugin supports it.

---

## 4. Tests to add

- Exceed limit on a test route and assert 429 + JSON shape.
- Per-user isolation: user A’s requests do not consume user B’s budget.
- Optional: Redis down behavior (fail open vs fail closed—document the choice; **fail closed** is safer for invite/claim if Redis is required for limits).

---

## 5. Rollout

1. Ship with **logging only** (count would-be blocks) if you need to calibrate thresholds.  
2. Enable enforcement per route class starting with **invite + claim**.  
3. Monitor 429 rates and adjust.

Update this document when limits are codified (file paths, actual numbers, Redis key scheme).
