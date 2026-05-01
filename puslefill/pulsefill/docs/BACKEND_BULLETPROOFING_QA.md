# PulseFill backend bulletproofing QA

This document tracks **correctness, safety, and observability** for the recovery loop and marketplace. Use it during hardening passes and before releases.

**Related:** [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) · [DB_INTEGRATION_TEST_PLAN.md](./DB_INTEGRATION_TEST_PLAN.md) · [RATE_LIMITING.md](./RATE_LIMITING.md) · [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md) · [backend-api-contracts.md](./backend-api-contracts.md) · [MARKETPLACE_FOUNDATION_QA.md](./MARKETPLACE_FOUNDATION_QA.md)

## Guiding principle

Every user action should **succeed cleanly**, **fail safely**, or return a **structured error** the UI can handle—no silent failures, no half-written rows, no raw internals in customer-facing responses.

---

## 1. Auth and context (current code paths)

| Area | Implementation hint | QA |
|------|----------------------|-----|
| Bearer parsing | `apps/api/src/plugins/auth.ts` | Invalid/missing token does not attach `authUser`; protected routes use guards. |
| Staff context | `apps/api/src/plugins/guards.ts` → `requireStaff` loads `staff_users` by `auth_user_id` | Multi-business staff must pass `business_id` query; value must match a row or `forbidden_business`. |
| Customer context | `requireCustomer` loads `customers` by `auth_user_id` | Returns `customer_profile_required` when no row. |
| Client-trusted IDs | Prefer `req.staff!.business_id` / `req.customer!.id` over body `business_id` | Audit routes that accept resource IDs in body/params and ensure each query filters by server context. |

Structured errors today include: `unauthorized`, `staff_required`, `business_id_required`, `forbidden_business`, `customer_profile_required`, `customer_lookup_failed`. Extend with stable `error` codes and optional `message` when tightening UX (see security doc).

---

## 2. Customer membership and discovery

Routes live under `apps/api/src/modules/customers/` (directory, invites, standby requests).

| Scenario | Expected |
|----------|----------|
| `GET /v1/customers/me/business-services` and `GET .../standby-labels` | `customer_discovery_enabled === true` → read allowed; otherwise **active membership** required (`403` `business_membership_required`). See `assertCustomerBusinessMetadataReadAllowed` in `membership.ts`. |
| Public join | Active membership; relationship reflects connected state. |
| Request to join | Single pending request semantics; no duplicate spam rows. |
| Private / invite | Detail returns invite-required style state; accept invite upserts membership. |
| Revoked / inactive | Excluded from matching and from “connected” standby flows. |

**Product clarity:** relationship payloads should imply a clear **next step** for the client (`enter_invite`, `wait_for_approval`, `setup_standby`, etc.)—verify API fields match iOS/dashboard copy.

---

## 3. Standby preferences

| Check | Notes |
|-------|--------|
| Active membership before save | Reject cross-business `service_id` / `location_id` / `provider_id`. |
| Uniqueness of “active” preference | No accidental duplicate active rows on edit. |
| Revoked preference | Excluded from matcher input. |

Implement validation in the API layer even if the DB has FKs—fail with structured errors, not 500s.

---

## 4. Opening lifecycle and operator actions

| Check | Notes |
|-------|--------|
| State transitions | Only legal transitions (open → offered → claimed → booked / terminal / cancelled / expired). |
| `available_actions` / queue context | Built server-side (see `operator-slot-detail-context.ts`, `assert-operator-action-allowed.ts`); UI should not infer actions alone. |
| Send offers / retry | Guarded by `checkSendOrRetryOffersAllowed`; must reject terminal slots. |

---

## 5. Send offers and notifications

| Check | Notes |
|-------|--------|
| Atomic DB | `send-offers-transaction.ts` + migration RPCs (`packages/db/migrations/0021_atomic_send_offers.sql`). |
| Idempotency / duplicates | RPC + unique constraints prevent duplicate offers for same opening/customer. |
| No-match | Atomic record + `no_matches_reason` / diagnostics in response and audit where applicable. |
| Notifications after commit | `send-offers-route.ts`: enqueue / notify after successful DB commit; failures log and do not roll back committed slot/offer state. |

---

## 6. Claims and confirmation

| Check | Notes |
|-------|--------|
| Race / double tap | Idempotent or `already_claimed`-style safe response. |
| Ownership | Customer claims only their offer; staff confirms only within `req.staff!.business_id`. |
| Atomic confirm | Opening + claim + side effects in one transaction where the product requires it. |
| Double confirm | Idempotent success. |

---

## 7. Activity and audit

| Check | Notes |
|-------|--------|
| Major events | Opening created, offers sent, no match, claim, confirm, expire, cancel, notification outcome. |
| Customer feed | No internal event names or other customers’ PII. |
| Staff feed | Enough context to operate; no secrets. |

---

## 8. Worker and webhooks

| Check | Notes |
|-------|--------|
| Job payload validation | Skip or dead-letter invalid jobs; log reason. |
| Stripe | Signature verified before trusting body (`stripe.routes.ts` when enabled). |
| Retries | Bounded; no customer spam on duplicate jobs. |

---

## 9. Automated tests (expand over time)

**Delegate / contract tests (current default):** Fast, no DB — see `apps/api` `*.test.ts` under `src/test/` and `src/modules/**`.

**Postgres + RPC integration (planned):** Scenarios that need real constraints and RPC behavior are listed in [DB_INTEGRATION_TEST_PLAN.md](./DB_INTEGRATION_TEST_PLAN.md).

Run from repo root:

```bash
pnpm --filter @pulsefill/api typecheck
pnpm --filter @pulsefill/api test
pnpm --filter @pulsefill/worker typecheck
pnpm --filter @pulsefill/shared typecheck
pnpm typecheck
```

**Enforcement tests added (API):**

- `src/test/security-request-id.test.ts` — `x-request-id` echo, 401 envelope, unknown-route 404.
- `src/test/rate-limit-contract.test.ts` — plugin 429 behavior.
- `src/modules/slots/open-slots.permissions.test.ts` — send-offers 404 + `request_id` when slot is absent for staff business (wrong-tenant guard).

Priority test themes (remaining):

1. Permission / cross-business (more routes: customer offers, standby prefs, staff standby review).
2. Send offers: success, no match, duplicate send, terminal slot rejected.
3. Claim / confirm: double claim, double confirm, expired offer (needs DB or broader seams).
4. Marketplace: public, request, private, invite duplicate paths.

---

## 10. Suggested execution order

1. Route-by-route permission audit (staff + customer).
2. Standby preference validation and membership gates.
3. Opening lifecycle + `available_actions` alignment with DB truth.
4. Send-offers / claim / confirm idempotency and race tests.
5. Activity/audit completeness.
6. Worker + webhook hardening.
7. Env/deploy checks ([DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md)).

When a checkbox block is done, add a short note with **PR link** and **date** in this file or in `SMOKE_RUN_LOG.md`.
