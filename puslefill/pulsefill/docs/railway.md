# Railway deployment (PulseFill)

Monorepo root: this `pulsefill/` directory. Use **pnpm** everywhere.

## Services

| Railway service | Role | Redis |
|-----------------|------|-------|
| **api** | Fastify HTTP (`/health`, `/v1/*`) | Set **`REDIS_URL`** on this service for BullMQ enqueue **and** shared `@fastify/rate-limit` counters when scaled. |
| **worker** | BullMQ consumer (`send-offer-notification`, `expire-offers`) | **`REDIS_URL`** required |
| **Redis** | Railway Redis (or Upstash TCP URL) | — |

Supabase and Stripe stay **external**.

**Secrets hygiene:** If a Redis URL or service-role key was exposed, rotate it in Railway and update variables on **api** / **worker** only. Do not duplicate backend secrets on Vercel unless a server workload needs them — see [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md) §7–9.

## Docker (optional, recommended for reproducible builds)

From the monorepo root (`pulsefill/`):

```bash
docker build -f Dockerfile.api -t pulsefill-api .
docker build -f Dockerfile.worker -t pulsefill-worker .
```

| Service | Dockerfile | Start (image CMD) |
|---------|------------|-------------------|
| **api** | `Dockerfile.api` | `node dist/server.js` in `apps/api` |
| **worker** | `Dockerfile.worker` | `node dist/worker.js` in `apps/worker` |

In Railway: **Builder → Docker**, set Dockerfile path per service. **Do not** run API and worker in one container.

- **API**: expose the port Railway assigns (`PORT`); app listens on `0.0.0.0`.
- **Health check**: `GET /health`

`.dockerignore` excludes `ios/`, `.next`, local `dist`, etc.

## Build & start (Nixpacks / Node, without Docker)

Set **Root directory** to this monorepo root.

### API service

- **Build:** `bash scripts/railway-build-api.sh` or `pnpm run railway:build:api`
- **Start:** `pnpm run start:api`
- **Health check path:** `/health`

### Worker service

- **Build:** `bash scripts/railway-build-worker.sh` or `pnpm run railway:build:worker`
- **Start:** `pnpm run start:worker`

### Environment variables

See `env.railway.example`. Minimum for API + worker:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` (same Redis for both services)
- `NODE_ENV=production`
- `PORT` is injected by Railway for **api**; the app reads `PORT` (default `3001` if unset).

The API does **not** need `SUPABASE_ANON_KEY` unless you add anon-key-based features; JWT verification uses the service role client.

## Dashboard (Next.js)

Copy `apps/dashboard-web/.env.example` → `.env.local`:

- `NEXT_PUBLIC_PULSEFILL_API_URL` — public Railway API URL
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — staff **email/password** sign-in

The dashboard uses Supabase Auth in the browser, then calls the API with `Authorization: Bearer <access_token>`. Optional **legacy JWT paste** on `/login` for internal testing without Supabase env.

## iOS

Configure tiers in `PulseFillBuildConfiguration.swift` and/or Xcode scheme variables (`PULSEFILL_API_BASE_URL`, `PULSEFILL_TIER`). See inline comments in that file.

## Database

Apply all SQL migrations in `packages/db/migrations/` through **`0008`** (Realtime publication + staff RLS for dashboard subscriptions). Earlier migrations cover core schema, RPCs, push devices (`0006`), and notification metadata (`0007`).

- **Supabase Realtime + RLS:** see `docs/supabase-realtime-rls.md`
- **Pilot runbooks:** see `docs/pilot-execution.md`

## Smoke test (staging)

1. `GET https://<api>/health` → `{ ok: true }`
2. Staff: dashboard sign-in → create open slot → send offers → worker logs / DB
3. Customer: iOS inbox → claim → dashboard claims → confirm booking
4. Worker: stale offers → `expire-offers` job

## Pilot readiness checklist

### Infra

- [ ] Migrations `0001`–`0008` applied in Supabase (`0008` = Realtime + staff browser RLS)
- [ ] Railway **api** deployed (Dockerfile.api or Nixpacks build)
- [ ] Railway **worker** deployed (Dockerfile.worker or Nixpacks build)
- [ ] Redis attached; `REDIS_URL` on api + worker
- [ ] `GET /health` OK on public API URL
- [ ] Worker starts and subscribes to `pulsefill-jobs`

### Env

- [ ] API: `SUPABASE_*`, `REDIS_URL`, `NODE_ENV=production`
- [ ] Worker: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`
- [ ] Dashboard: `NEXT_PUBLIC_PULSEFILL_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] iOS staging: Railway API + real Supabase URL/anon (or scheme env overrides)

### Auth

- [ ] Staff can sign in on dashboard (Supabase) or legacy JWT for internal tests
- [ ] API `requireStaff` accepts staff JWTs
- [ ] Customer iOS auth + `session/sync` works

### Product loop (staging)

- [ ] Create slot → send offers → queue job → offer row updates
- [ ] Customer sees offer → claims → dashboard shows claim → confirm booking
- [ ] Expiry sweep / worker behavior matches expectations

### APNs (real device)

Use a **physical iPhone** (simulator does not receive APNs).

**Before testing**

- [ ] Push Notifications capability enabled on the PulseFill target (Signing & Capabilities)
- [ ] Bundle ID matches the APNs topic / worker config (`APNS_BUNDLE_ID` when wired)
- [ ] Worker env: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_PRIVATE_KEY` (when sending real pushes)
- [ ] Staging/device debug: `APNS_ENVIRONMENT=development` on the worker
- [ ] Migration for `customer_push_devices` applied; device can call `POST /v1/customers/me/push-devices`

**Validation flow**

1. Sign in on the iOS app → allow notifications when prompted
2. Confirm a row exists in `customer_push_devices` for that customer (or watch API success)
3. Dashboard: create slot → send offers
4. Worker logs: device token found → APNs success (once wired)
5. Phone receives notification → tap → app opens to **Offers** (deep-link data: `kind`, `offerId`, `openSlotId`)

**If push fails**, check in order: wrong bundle ID, wrong environment (dev vs prod), malformed `.p8` newlines in env, missing push capability, no registered device token, missing worker env vars.
