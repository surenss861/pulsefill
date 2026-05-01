# PulseFill security and reliability hardening

This expands **backend bulletproofing** into explicit **security and abuse-resistance** work: auth, authorization, privacy, rate limits, webhooks, and safe errors.

**Companion:** [BACKEND_BULLETPROOFING_QA.md](./BACKEND_BULLETPROOFING_QA.md) · [DB_INTEGRATION_TEST_PLAN.md](./DB_INTEGRATION_TEST_PLAN.md) · [RATE_LIMITING.md](./RATE_LIMITING.md) · [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md)

---

## Current baseline (as of this doc)

| Layer | Status |
|-------|--------|
| Framework | Fastify 5 (`apps/api/src/app.ts`) |
| CORS | `@fastify/cors` with production warning when `API_CORS_ORIGINS` empty |
| Request ID | `plugins/request-id.ts` — safe `x-request-id` passthrough or UUID; response header set |
| Auth | Optional Bearer → `req.authUser` via service Supabase (`plugins/auth.ts`) |
| Authorization | `requireStaff` / `requireCustomer` (`plugins/guards.ts`) |
| Errors | `plugins/error-handler.ts` — stable 4xx codes, `request_id` on JSON errors, safe production messages |
| Action errors | `sendActionError` adds top-level `request_id` (nested `error.code` unchanged for clients) |
| Rate limits | `plugins/rate-limit.ts` — global + route tiers; Redis-backed when `REDIS_URL` is set; disabled when `RATE_LIMIT_DISABLED` (API tests) |
| Test auth | `PULSEFILL_API_TEST=1` + `test-token` and route-test headers—**must never ship enabled in production** |
| Readiness | `GET /ready` checks **Postgres** only (not Redis); see [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md) |

---

## 1. Middleware and request hygiene (recommended)

Implemented: **request IDs**, **structured global errors**, **rate limiting** (see [RATE_LIMITING.md](./RATE_LIMITING.md)). Still recommended:

1. **Security headers** – minimal set appropriate for JSON API (e.g. disable caching for authenticated routes where relevant).
2. **Body size limits** – Fastify defaults; tighten for auth-adjacent routes if needed.
3. **Route-level errors** should use `sendJson` / `sendPublicError` / `sendActionError` so JSON 4xx/5xx include `request_id` where applicable.
4. **Log redaction** – ensure auth plugin and webhooks never log full tokens or Stripe signing secrets.

---

## 2. Authorization rules (non-negotiable)

- **Staff:** Every staff mutation or list must scope by `req.staff!.business_id` (or equivalent join). Never trust a client-supplied `business_id` for authorization; the query param on `requireStaff` is only for **selecting** among the caller’s own staff rows.
- **Customer:** Scope offers, claims, preferences, and activity by `req.customer!.id`. **Mutations** that attach the customer to a business (e.g. creating standby preferences) require **active** `customer_business_memberships` for that `business_id` (see `POST /v1/customers/me/preferences` in `customers.routes.ts`).
- **Cross-resource IDs:** For every `open_slot_id`, `claim_id`, `offer_id`, validate the row belongs to the same business (staff) or customer (customer) before returning or mutating.

### Customer GET access (discovery vs private)

**Policy intent (product + security):**

- **Public / discoverable businesses** — It is acceptable for authenticated customers to read **customer-safe, discovery-oriented** data for businesses that are intentionally visible (e.g. directory list/detail, and related read-only hints such as services or labels used to build the join flow), as long as responses do not leak operator-only or cross-tenant private state.
- **Private / non-discoverable businesses** — Reads that expose business-specific operational or pre-join detail should require **invite acceptance or active membership**, matching the business’s `standby_access_mode` / discovery flags.
- **Preference save, claims, offers, private customer state** — Always scoped by `req.customer!.id` and, where a `business_id` is written, **active membership** is required (preferences create is enforced in API today).

Do not blanket-require membership on every customer GET: marketplace **discovery** needs some read surface before join. When tightening a route, decide explicitly: *public discovery OK vs membership-only*, then enforce and test.

**Implemented:** `GET /v1/customers/me/business-services` and `GET /v1/customers/me/standby-labels` use `assertCustomerBusinessMetadataReadAllowed` (`membership.ts`): if `customer_discovery_enabled` is **true**, any authenticated customer may read customer-safe service/label metadata; if **false** (or null), an **active** `customer_business_memberships` row is required (`403` `business_membership_required` with `request_id`). Directory detail under `/v1/customers/directory/businesses/:id` remains discovery-gated separately.

**Product note (`standby_access_mode` vs discovery):** Metadata reads on those routes **do not** consult `standby_access_mode`. Intentionally, **`customer_discovery_enabled` alone** decides whether pre-membership reads are allowed — e.g. a clinic can be **discoverable** (name/services visible for browse) while **`standby_access_mode = private`** still means **joining** goes through invite / membership flows elsewhere. If the product ever needs “`private` hides all pre-join reads even when discovery is on,” add a composite rule in `assertCustomerBusinessMetadataReadAllowed` and extend tests.

---

## 3. Auth and session safety

| Topic | Action |
|-------|--------|
| Token logging | Audit `plugins/auth.ts` and webhook handlers. |
| Session expired | Align Supabase errors with `session_required`-style JSON for API consumers. |
| Test bypass | Gate `PULSEFILL_API_TEST` so production builds cannot enable test token path. |
| Dashboard / iOS callbacks | Allowlist redirect origins and paths (document in dashboard repo). |

### 401 shape: `unauthorized` (guards) vs `session_required` (global handler)

- **`requireAuth` / `sendPublicError(..., 401, "unauthorized", ...)`** — explicit guard responses use the stable machine code **`unauthorized`** with a customer-safe `message` and `request_id`.
- **Unhandled 401s** (e.g. `reply.unauthorized()` or errors with `statusCode: 401` that reach `plugins/error-handler.ts`) are mapped to **`session_required`** plus a generic message and `request_id`.

Clients that branch on `error` should treat both as “not authenticated”; do not rename guard codes without a coordinated client bump.

---

## 4. Customer and business privacy

- Customer responses: **customer-safe** statuses only; no internal diagnostics to unrelated users.
- Staff responses: operational detail without unnecessary PII; audit tables should not store full push tokens or raw payment payloads.
- Errors: no SQL, stack traces, or internal IDs that leak enumeration where avoidable.

---

## 5. Webhooks and billing

When `ENABLE_STRIPE_WEBHOOK_ROUTES` is on:

- Verify Stripe signature **before** parsing as trusted.
- Handle **duplicate** `event.id` idempotently (store seen IDs or rely on Stripe replay semantics + safe upserts).
- Do not log full signing secret or raw card data.

---

## 6. Database safety net

Prefer **constraints and partial unique indexes** for:

- One active membership per `(customer_id, business_id)` where that is the product rule.
- One pending standby request per pair if that is the product rule.
- Unique active offer per `(open_slot_id, customer_id)` where applicable.

App logic should still validate; constraints are the last line of defense.

---

## 7. Implementation priority (security-focused)

1. Permission and ownership audit + tests.  
2. Rate limiting ([RATE_LIMITING.md](./RATE_LIMITING.md)).  
3. Production error normalization and log redaction.  
4. Webhook idempotency and billing flags.  
5. Constraint/index pass in `packages/db` where gaps are found.

---

## 8. Validation commands

```bash
pnpm --filter @pulsefill/api typecheck
pnpm --filter @pulsefill/api test
pnpm --filter @pulsefill/worker typecheck
pnpm --filter @pulsefill/shared typecheck
pnpm typecheck
```
