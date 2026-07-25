# Monitoring and alerts (PulseFill)

What to configure, where, and the exact thresholds — the click-through in each dashboard is on you; this doc is the specification.

---

## 1. What already exists in the repo (no setup needed)

- **Structured request logs**: every request gets an `x-request-id` (`apps/api/src/plugins/request-id.ts`) and JSON errors embed `request_id` (`plugins/error-handler.ts`). Confirm your Railway service actually ships stdout somewhere queryable (Railway's own log viewer retains a limited window — for anything beyond ad-hoc debugging, forward to a log sink, see §3).
- **Health/readiness**: `GET /health` (liveness, no DB) and `GET /ready` (Supabase round-trip). Both already exist — §2 below is about pointing an uptime checker at them, not building them.
- **Webhook dedup**: `processed_stripe_events` — a webhook processing failure is now distinguishable from a duplicate-delivery no-op in logs.

---

## 2. Uptime / synthetic checks

Point an external checker (Railway's own, or a free tier of Better Stack / UptimeRobot / Pingdom) at:

| URL | Expected | Alert if |
|---|---|---|
| `https://<api>/health` | `200`, `{"ok":true,...}` | non-200, or no response in 10s, for 2 consecutive checks |
| `https://<api>/ready` | `200`, `{"ready":true,"checks":{"database":"ok"}}` | non-200 **or** `checks.database !== "ok"` for 2 consecutive checks — this means Supabase is unreachable, which is a full outage, not a blip |
| `https://<dashboard>/` (Vercel) | `200` | non-200 for 3 consecutive checks (Vercel edge network is already resilient; don't page on a single miss) |

Check interval: 60s for `/health`/`/ready` (cheap, no DB load beyond the existing one-row select), 5 min for the dashboard.

---

## 3. Railway (api + worker services)

**Deploy alerts** (Railway project settings → Notifications):
- Deploy failed → immediate alert (Slack/email/PagerDuty webhook — Railway supports all three natively).
- Service crashed / restarted unexpectedly → immediate alert. A worker crash-loop means no offer notifications, no expiry sweep, and now no stale-payment-authorization release — treat as high severity.

**Resource alerts** (Railway → service → Metrics, if your plan exposes threshold alerts):
- Memory > 85% sustained 5 min → warning.
- CPU > 90% sustained 5 min → warning (check for a runaway query or an infinite retry loop before scaling).

**Log-based alerts** (forward Railway logs to a sink — Better Stack Logs, Axiom, or Datadog all have a free/cheap tier with a Railway log-drain integration):
- `stripe webhook handler failed` (from `stripe.routes.ts`) → warning, check within the hour. A sustained run of these means Stripe state and PulseFill state are diverging.
- `confirm_finalize_after_capture_failed` (from `open-slots.routes.ts`) → **page immediately**. This means a customer's card was captured but the booking wasn't recorded as confirmed — a real money/data inconsistency requiring manual reconciliation.
- `[pulsefill-jobs] job failed` (worker) → warning if isolated, page if more than 5 in 10 minutes (queue backing up).
- `connect_account_webhook_update_failed` / `payment_row_lookup_failed` → warning.

---

## 4. Vercel (dashboard-web)

- Deploy failed → immediate alert (Vercel project → Settings → Notifications, or GitHub PR checks if deploys are PR-gated).
- No runtime alerting needed beyond the uptime check in §2 — Vercel's own platform monitors edge/serverless health.

---

## 5. Stripe

Stripe dashboard → Developers → Webhooks → your endpoint → **has its own delivery-failure view already** — no separate tool needed:
- Enable Stripe's built-in email alerts for webhook endpoint failures (Stripe dashboard → Webhooks → endpoint → "Send email if failure rate is high").
- Additionally watch Stripe's **Radar**/dispute dashboard once marketplace payments go live — a dispute on a captured claim payment needs a human, not an automated alert rule.

---

## 6. Error tracking (Sentry or equivalent) — not yet wired

No error-tracking SDK is installed yet (`apps/api`, `apps/worker`, `apps/dashboard-web` all currently rely on structured console logs only). This is intentionally **not** wired up with a placeholder DSN — an inert SDK with no real project behind it just adds a dependency without adding visibility, and it's easy to mistake for "monitoring is live" when it isn't.

**When you have a Sentry (or Highlight/Bugsnag) account and DSN**, the wiring is small:
- `apps/api`: `Sentry.init({ dsn })` in `server.ts` before `buildApp`, plus `app.setErrorHandler` forwarding to `Sentry.captureException` alongside the existing `error-handler.ts` logic.
- `apps/worker`: wrap the job dispatch in `worker.ts`'s `on("failed", ...)` handler with `Sentry.captureException`.
- `apps/dashboard-web`: `@sentry/nextjs` has a setup wizard (`npx @sentry/wizard@latest -i nextjs`) that handles the Next.js-specific wiring (client/server/edge configs) automatically — faster and more correct than hand-wiring.

Gate all three behind an env var (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`) so local dev and CI don't need a real project.

---

## 7. What NOT to alert on

- `rate_limited` (429) responses — expected under normal abuse-prevention behavior, not an incident. Track the *rate* of 429s as a metric if you want visibility into whether limits are too tight, but don't page on it.
- Individual `payment_intent.canceled` webhooks — most of these are the expected outcome of a lost-race claim or Stripe's own 7-day authorization expiry, not a failure.
- Single `notification_logs.status = 'failed'` rows — a customer with push disabled or no registered device is expected traffic, not an incident (see `delivery-reliability.ts`'s existing distinction between this and true delivery failures).
