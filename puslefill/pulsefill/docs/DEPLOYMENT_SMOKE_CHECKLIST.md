# Deployment smoke checklist

Use before and after promoting API, worker, dashboard, or iOS builds that depend on backend behavior.

**Env template:** `env.railway.example` at repo root  
**Railway notes:** [railway.md](./railway.md)

---

## 1. Deploy order

1. Apply **database migrations** (`packages/db/migrations/`) to the target Supabase project.
2. Deploy **API** (`Dockerfile.api` or Railway service) once migrations are compatible.
3. Deploy **worker** if notification/queue behavior changed.
4. Deploy **dashboard** / marketing with `NEXT_PUBLIC_PULSEFILL_API_URL` pointing at the live API.
5. Ship **iOS** with scheme env pointing at the same API tier (`PULSEFILL_API_BASE_URL`).

Rollback plan: revert API/worker first; avoid rolling back migrations without a forward fix.

---

## 2. Required environment (API)

Validated at startup via `apps/api/src/config/env.ts` (`loadEnv`):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) |

**Strongly recommended in production**

| Variable | Purpose |
|----------|---------|
| `API_CORS_ORIGINS` | Comma-separated exact origins; if unset in production, CORS is effectively off and browsers cannot call the API from the dashboard. `app.ts` logs a warning. |
| `REDIS_URL` | BullMQ queue for send-offer notifications and maintenance sweeps; API degrades gracefully when absent but jobs will not enqueue. When set on the API service, `@fastify/rate-limit` also uses Redis so per-user/IP limits stay consistent across multiple API instances. |

**Optional**

| Variable | Purpose |
|----------|---------|
| `CUSTOMER_APP_BASE_URL` | Invite links for customer flows |
| `RATE_LIMIT_DISABLED` | Set `1` only to disable API rate limits (emergency); leave unset/false in production |
| `STRIPE_*`, `ENABLE_BILLING_ROUTES`, `ENABLE_STRIPE_WEBHOOK_ROUTES` | Billing pilot |
| `PUSH_PROVIDER`, `APNS_*` | Push delivery |

---

## 3. Health endpoints

| Route | Meaning |
|-------|---------|
| `GET /health` | Process up (no dependency checks). |
| `GET /ready` | Service-role **Postgres** reachable (`businesses` limit 1). Returns `503` if DB check fails. **`REDIS_URL` is not probed** — a bad Redis URL does not fail readiness; rate limits then use in-memory per instance or fail-open per [RATE_LIMITING.md](./RATE_LIMITING.md). |

Load balancers: use `/ready` for readiness; use `/health` for liveness only if you accept “up but cannot reach DB”.

**Redis and readiness:** Keeping `/ready` DB-only avoids flapping when Redis is briefly unavailable but the API can still serve non-limited traffic. If you later require Redis for synchronous product paths, add an explicit Redis check (or a separate internal `/ready/redis` diagnostic) and document load-balancer behavior.

**Secrets:** `REDIS_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and Stripe secrets belong on the **trusted API** host (e.g. Railway API service). Do not duplicate them on static frontends (Vercel) unless a **server-only** workload in that project truly needs them.

---

## 4. Smoke requests (replace base URL)

```bash
BASE=https://YOUR_API.up.railway.app

curl -sS "$BASE/health" | jq .
curl -sS "$BASE/ready" | jq .
```

Authenticated smoke (staff):

```bash
# After obtaining a real Supabase JWT for a staff user
curl -sS -H "Authorization: Bearer $JWT" \
  "$BASE/v1/businesses/mine/..." 
```

Authenticated smoke (customer): same pattern with customer session.

---

## 5. Post-deploy product smoke (15 minutes)

- [ ] Dashboard loads without CORS errors (browser devtools network).
- [ ] Staff can load workspace summary / open slots list.
- [ ] Create opening → send offers → at least one customer path (or no-match path) behaves as expected.
- [ ] Customer directory + business detail match access mode (public / request / private).
- [ ] Claim + confirm path completes or fails with a clear JSON error.
- [ ] iOS customer can sign in and hit the same API base URL.

Record outcomes in `SMOKE_RUN_LOG.md` when doing formal releases.

---

## 6. Secrets and logs

- [ ] No service role key or Stripe secrets in client bundles.
- [ ] API logs in production do not print raw JWTs or full webhook bodies (audit `error-handler` and route-level logging).

---

## 7. Redis credentials and where `REDIS_URL` belongs

**Host `REDIS_URL` on the trusted backend:**

| Service | `REDIS_URL` |
|---------|-------------|
| **Railway PulseFill API** | **Yes** — required for shared rate-limit counters across scaled API replicas and consistent with `apps/api` `loadEnv`. |
| **Railway worker** (if used) | **Yes** — BullMQ / queues typically need the same Redis. |
| **Vercel (dashboard / marketing)** | **Only if** a **server-side** route in that project talks to Redis. If the app is only browser + `NEXT_PUBLIC_*` calling Railway, **do not** store `REDIS_URL` on Vercel. |

**If a full Redis URL (user, password, host) was ever pasted** in chat, a ticket, or a screenshot, treat it as **compromised**:

1. In **Railway** (Redis plugin or managed Redis), **regenerate / rotate** the password or replace the instance credential.
2. Update **`REDIS_URL`** on the **Railway API** service (and worker if applicable). Redeploy.
3. Remove obsolete Redis variables from **Vercel** unless a server workload still needs them.

**`RATE_LIMIT_DISABLED`:** In production it must be **unset** or explicitly **`false`**. If it is `true`, the API skips registering `@fastify/rate-limit` entirely.

---

## 8. Verify rate limits are active (after deploy)

`/ready` does **not** connect to Redis (see §3). Confirm limits separately:

1. Confirm **`RATE_LIMIT_DISABLED`** is not enabled on the API service.
2. Pick a route with a **stricter** tier (e.g. customer claim: `POST /v1/open-slots/:id/claim` — requires a valid JWT and body; for a quick anonymous check you can hammer a global-limited anonymous path if you add one, or use staff send-offers with auth — tune volume to your deployed `max` / `timeWindow` in `rate-limit.ts`).
3. Send enough requests in a short window to exceed the limit.

Example (replace `BASE` and use a real **customer** Bearer token for claim, or adjust URL to match your test):

```bash
BASE=https://YOUR_API.up.railway.app
JWT="eyJ..."   # real Supabase customer access token

for i in $(seq 1 80); do
  curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/v1/open-slots/REPLACE_OPEN_SLOT_UUID/claim" \
    -H "Authorization: Bearer $JWT" \
    -H "content-type: application/json" \
    -d '{}'
done | sort | uniq -c
```

You should eventually see **`429`** responses. Body shape (stable contract):

```json
{
  "statusCode": 429,
  "error": "rate_limited",
  "message": "Too many attempts. Try again in …",
  "request_id": "…"
}
```

**If you never see 429:**

- `RATE_LIMIT_DISABLED=true` on the API.
- **`REDIS_URL` missing** on the Railway **API** service (limits fall back to **per-instance memory** — harder to hit the same counter when testing through a single IP, and different under load).
- Volume too low for the configured `max` / `timeWindow` for that route tier.
- Hitting **`/health`** or **`/ready`** only — those paths are **allowlisted** and not rate limited.

---

## 9. Railway API vs Vercel (variable split)

**Railway — API service (trusted backend):**

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` (API rate limits + any API-side queue usage)
- `API_CORS_ORIGINS` (e.g. `https://your-app.vercel.app`)
- `STRIPE_SECRET_KEY`, webhook secret, feature flags as needed
- `NODE_ENV=production`
- Do **not** set `RATE_LIMIT_DISABLED` in normal production.

**Vercel — browser-facing Next app:**

- `NEXT_PUBLIC_PULSEFILL_API_URL` (or equivalent) → Railway API base URL
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client Supabase
- **Never** `NEXT_PUBLIC_*` for service role, Stripe secret, or Redis password.

**Rule of thumb:** If Vercel is not executing trusted server code that calls Redis or Postgres with the service role, those secrets should **not** be in Vercel at all.
