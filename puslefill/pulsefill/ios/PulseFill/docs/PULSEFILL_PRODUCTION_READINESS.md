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
- [ ] Distribution signing: `get-task-allow` false; `aps-environment` production for App Store / TestFlight (verify exported archive / Organizer)
- [ ] `PulseFillReleaseOverrides.xcconfig`: real Supabase URL + publishable/anon key; API base URL; tier
- [ ] Customer loop QA (see `CUSTOMER_UI_QA_CHECKLIST.md`, `CUSTOMER_FLOW_SMOKE_TEST.md`)
- [ ] Business / operator QA (see `IOS_OPERATOR_QA_CHECKLIST.md`, `BUSINESS_MODE_LIVE_WORKFLOW_QA.md`)
- [ ] Push registration and notification routing smoke-tested on device

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

- [ ] Railway (or host) env parity with iOS and dashboard
- [ ] Vercel / web dashboard env and feature flags documented
- [ ] Archive pipeline: `bash scripts/archive-testflight.sh` → upload `ios/PulseFill/build/PulseFill.xcarchive` (or export IPA) consistently

---

## App Store

- [ ] Privacy nutrition / privacy policy URLs
- [ ] Support URL and metadata
- [ ] Screenshots and copy for current flows

---

## Security

- [ ] No service role or secrets in client bundles
- [ ] RLS / API auth reviewed for customer vs business routes
- [ ] Rate limits or abuse basics where needed

---

## Monitoring

- [ ] Error reporting (e.g. Sentry) for API and optionally iOS
- [ ] Uptime / synthetic checks or log-based alerts for critical paths

---

## Notes

- **DerivedData:** If archives fail with `build.db` disk I/O errors, clear `~/Library/Developer/Xcode/DerivedData/PulseFill-*` and rely on the script’s temp DerivedData path; do not paste shell examples with inline `# comments` on the same line as commands in zsh (use separate lines or `:` comments).
- **Signing:** Development entitlements in a local `.xcarchive` do not replace Organizer export settings; confirm the exported IPA for TestFlight uses distribution provisioning.
