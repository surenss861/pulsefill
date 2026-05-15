# PulseFill API (`@pulsefill/api`)

Fastify service for Railway (or any Node host). Validates critical production env on boot — see `src/config/production-readiness.ts` and `src/server.ts`.

## Required environment

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | Use `production` on Railway. |
| `PORT` | Railway sets this automatically if you bind `$PORT`. |
| `SUPABASE_URL` | Must be **`https://…`** in production (enforced at startup). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role JWT for server-side Supabase (never ship to clients). |
| `LOG_LEVEL` | Optional; default `info`. |

### CORS (required in production)

| Variable | Notes |
|----------|--------|
| `API_CORS_ORIGINS` | Comma-separated **origins only** (no path), e.g. `https://pulsefill.vercel.app`. In `NODE_ENV=production` the process **exits on startup** if this is missing or empty. |

## Not read by this Node API

These names often appear on the same Railway project for **Next.js / Vercel**:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser bundle only.
- `SUPABASE_ANON_KEY` — harmless to set for parity with other services, but **this API package does not load it** today. Auth to Supabase from the API uses the **service role** client only (`src/config/supabase.ts`).

If you add server-side features that need the anon key, wire a new `Env` field in `src/config/env.ts` first.

## Optional: billing & Stripe

When `ENABLE_BILLING_ROUTES=true`, startup also requires:

- `STRIPE_SECRET_KEY`
- `STRIPE_SUBSCRIPTION_PRICE_ID`
- `DASHBOARD_URL` (e.g. `https://pulsefill.vercel.app`)

When `ENABLE_STRIPE_WEBHOOK_ROUTES=true`, startup requires:

- `STRIPE_WEBHOOK_SECRET`

## Health checks

After deploy:

```bash
curl -sS "https://<your-api-host>/health"
curl -sS "https://<your-api-host>/ready"
```

- **`GET /health`** — process up; no database call.
- **`GET /ready`** — service-role Supabase probe (`businesses` limit 1). **503** means the API process is up but DB/Supabase is not reachable with current credentials.

Both responses include non-secret metadata (`service`, `version`, optional `revision`, `supabase_host`, flags). Every response should carry header **`x-request-id`**.

## Operations

- Keep Railway billing current; a paused or throttled workspace makes the product look broken regardless of code.
- Align **one** Supabase project across iOS, dashboard, and this API (`SUPABASE_URL` + JWT validation path).
