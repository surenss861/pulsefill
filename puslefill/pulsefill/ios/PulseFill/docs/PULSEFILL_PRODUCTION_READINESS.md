# PulseFill production readiness

Single place to track what must be green before treating PulseFill as **production-shippable**. Update this file as items complete; link PRs or TestFlight build numbers in notes when helpful.

---

## Auth

- [ ] Empty password: validation only; no Supabase / Railway session sync
- [ ] Bad email: validation copy
- [ ] Wrong password: auth error (not generic connection)
- [ ] Network failure: connection copy
- [ ] Correct sign-in: enters app shell
- [ ] Sign-up: session or clear verify-email path
- [ ] Session restore after app kill / reopen
- [ ] Sign-out clears session and UI state
- [ ] TestFlight footer `PulseFillSourceRevision` matches the commit you intend (see `scripts/archive-testflight.sh`)

---

## iOS

- [ ] Release archive succeeds (no DerivedData `build.db` I/O errors; script uses isolated `-derivedDataPath`)
- [x] `aps-environment` production entitlements file (`PulseFill-Release.entitlements`) wired to the Release build configuration — no longer relying solely on automatic-signing rewrite. Still verify the exported archive's embedded entitlements in Organizer before upload (real device/Apple Developer account required).
- [ ] Distribution signing: `get-task-allow` false (verify exported archive / Organizer)
- [ ] `PulseFillReleaseOverrides.xcconfig`: real Supabase URL + publishable/anon key; API base URL; tier
- [ ] Customer loop QA (see `CUSTOMER_UI_QA_CHECKLIST.md`, `CUSTOMER_FLOW_SMOKE_TEST.md`)
- [ ] Business / operator QA (see `IOS_OPERATOR_QA_CHECKLIST.md`, `BUSINESS_MODE_LIVE_WORKFLOW_QA.md`)
- [ ] Push registration and notification routing smoke-tested on device
- [x] In-app account deletion (Guideline 5.1.1(v)): `DELETE /v1/customers/me` + Profile → Account → Delete account — scrubs PII, deactivates push devices/standby preferences, deletes the Supabase auth identity; verified against a real local Postgres migration chain and a real Xcode build

---

## Web dashboard

- [ ] `/overview`: setup, billing gate, recovery health, next actions, waitlist counts
- [ ] `/open-slots`: create, send offers, confirm, expire/cancel, filters
- [ ] `/customers`: invite, codes, waitlist approve/decline, customer detail / desk file
- [ ] `/activity`: recovery log, filters, bulk actions
- [ ] `/billing`: Stripe checkout, portal, canceled/incomplete states
- [ ] `/settings`: sign-out, workspace readability

---

## API

**Implemented in repo (verify on your deploy):**

- [x] Structured request logging (`apps/api/src/plugins/structured-request-log.ts`) + `x-request-id` on every response (`plugins/request-id.ts`); JSON errors include `request_id` (`plugins/error-handler.ts`).
- [x] Health + readiness: `GET /health` (liveness, no DB) and `GET /ready` (Supabase service-role `businesses` probe). Both return non-secret metadata: `service`, `version`, optional `revision` (from `RAILWAY_GIT_COMMIT_SHA` / `VERCEL_GIT_COMMIT_SHA` / `GITHUB_SHA` / `COMMIT_SHA`), `node_env`, `time`, `supabase_host`, Stripe/APNs flags (`apps/api/src/routes/index.ts`, `apps/api/src/lib/service-meta.ts`).
- [x] Production startup validation: `assertProductionStartup` (`apps/api/src/config/production-readiness.ts`, called from `apps/api/src/server.ts`) — in `NODE_ENV=production` requires `https` `SUPABASE_URL`, non-empty `API_CORS_ORIGINS`, and Stripe env when `ENABLE_BILLING_ROUTES` / `ENABLE_STRIPE_WEBHOOK_ROUTES` are on.
- [x] Automated checks: `apps/api/src/routes/health.readiness.test.ts`.

**Still your ops / QA responsibility:**

- [ ] Clear 401 vs 403 vs 5xx semantics verified end-to-end for each client surface
- [ ] Supabase **same project** as iOS: `SUPABASE_URL` / service role / JWT validation aligned with customer tokens

**Breaking change:** In `NODE_ENV=production`, the API process **exits on boot** if `API_CORS_ORIGINS` is unset/empty, `SUPABASE_URL` is not `https`, or Stripe-related env is missing while billing/webhook flags are enabled. Fix Railway/Vercel env before deploying.

---

## Database

- [ ] Migrations applied and documented for production
- [ ] Seed / demo data path for QA (non-production only)
- [ ] Backup and restore / rollback plan documented

---

## Billing

- [ ] Stripe Checkout for activation
- [ ] Billing portal for management
- [ ] Webhook signature verification
- [ ] Subscription state persisted and API/dashboard entitlement gating correct
- [ ] Trial / canceled / incomplete handling

---

## Push

- [ ] APNs environment matches build type (development vs production)
- [ ] End-to-end: server → device for at least one critical notification type

---

## QA

- [ ] Auth matrix signed off on latest TestFlight
- [ ] Seeded discovery loop: request → approve → customer sees correct state
- [ ] Regression tests green (`PulseFillTests`, including auth pipeline tests)

---

## Deployment

- [ ] Railway (or host) env parity with iOS and dashboard — see **`apps/api/README.md`** for required variables (note: **`SUPABASE_ANON_KEY` / `NEXT_PUBLIC_*` are not read by this API**; service role + URL are).
- [ ] Vercel / web dashboard env and feature flags documented
- [ ] Archive pipeline: `bash scripts/archive-testflight.sh` → upload `ios/PulseFill/build/PulseFill.xcarchive` (or export IPA) consistently
- [ ] Host billing (e.g. Railway subscription) current so the service is not paused mid-QA

---

## App Store

- [x] `PrivacyInfo.xcprivacy` manifest added to the app target
- [x] Privacy Policy / Terms / Support pages drafted (`apps/marketing-site/app/{privacy,terms,support}`) — fill in `[TODO]` placeholders (legal entity, address, support email) before publishing
- [x] App Store description/keywords/review notes drafted — see `docs/APP_STORE_SUBMISSION_NOTES.md`
- [ ] Deploy marketing site so privacy/terms/support URLs are live before submission
- [ ] Screenshots for current flows (see checklist in `docs/APP_STORE_SUBMISSION_NOTES.md`)
- [ ] Demo account seeded and credentials filled into submission notes

---

## Security

- [ ] No service role or secrets in client bundles
- [ ] RLS / API auth reviewed for customer vs business routes
- [ ] Rate limits or abuse basics where needed

---

## Monitoring

- [x] Exact alert rules and thresholds documented — see `docs/MONITORING_AND_ALERTS.md`
- [ ] Uptime checker actually pointed at `/health` + `/ready` (Railway) and dashboard root (Vercel) per that doc
- [ ] Railway/Vercel deploy + log-based alerts actually configured per that doc
- [ ] Error reporting (e.g. Sentry) wired for API/worker/dashboard once a real DSN exists (deliberately not stubbed with a placeholder — see doc §6)

---

## Notes

- **DerivedData:** If archives fail with `build.db` disk I/O errors, clear `~/Library/Developer/Xcode/DerivedData/PulseFill-*` and rely on the script’s temp DerivedData path; do not paste shell examples with inline `# comments` on the same line as commands in zsh (use separate lines or `:` comments).
- **Signing:** Development entitlements in a local `.xcarchive` do not replace Organizer export settings; confirm the exported IPA for TestFlight uses distribution provisioning.
