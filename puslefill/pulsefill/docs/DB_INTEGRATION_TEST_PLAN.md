# DB / RPC integration test plan (PulseFill API)

**Purpose:** Complement fast **delegate-based** route tests (`PULSEFILL_API_TEST`) with jobs that hit **real Postgres + RPC** so idempotency and constraints are validated against production-shaped data.

**Related:** [BACKEND_BULLETPROOFING_QA.md](./BACKEND_BULLETPROOFING_QA.md) · [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) · `packages/db/migrations/`

---

## 1. Why this exists

Unit and seam tests prove **routing, guards, and response shapes**. Only a database can prove:

- Unique indexes and RPCs prevent duplicate `slot_offers` / illegal transitions.
- `claim_open_slot` / `confirm_open_slot_claim` behave under concurrency.
- `customer_business_memberships` gates match RLS and app rules.

---

## 2. Suggested CI shape

| Piece | Suggestion |
|-------|------------|
| Runner | GitHub Actions (or equivalent) with a **throwaway Postgres** or **Supabase branch** per run. |
| Migrations | Apply `packages/db/migrations/*.sql` in order before tests. |
| Seed | Minimal seed: one business, staff, locations/services, customers, memberships as needed per case. |
| API | `buildApp(loadEnv())` or HTTP against `docker compose` API + real `SUPABASE_URL` + service role. |
| Secrets | CI secrets mirror prod variable **names** only; never commit URLs/passwords. |

---

## 3. Test cases (priority order)

1. **Atomic send offers** (`0021_atomic_send_offers` / `send-offers-transaction`) — happy path, no-match, second send does not duplicate offers for same `(open_slot_id, customer_id)` where constrained.
2. **Double claim** — two concurrent or sequential `claim_open_slot` calls: second outcome is safe (existing claim / stable conflict), no double-winner for same slot rules.
3. **Double confirm** — idempotent confirm when already `booked` + claim `confirmed`.
4. **Membership** — `POST /v1/customers/me/preferences` without `customer_business_memberships` row returns **`403` `business_membership_required`** (after invite-accept path creates membership, POST succeeds).
5. **Terminal / expired** — claim or confirm rejected with stable error codes from RPC or route layer.

---

## 4. Out of scope for first iteration

- Full notification delivery (APNs) — mock or worker contract tests.
- Load testing rate limits against Redis — covered by manual smoke ([DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md)) and `rate-limit-contract.test.ts` locally.

---

## 5. Done criteria

- [ ] One CI workflow runs migrations + seed + a small **Vitest/node:test** file (or dedicated script) against real DB.
- [ ] Failures block merge on `main` (or on release branches).
- [ ] Document connection string sourcing in the workflow README comment (not in this repo’s committed env files).

---

## 6. Validation (repo + manual)

After implementing the workflow:

```bash
pnpm --filter @pulsefill/api typecheck
pnpm --filter @pulsefill/api test
pnpm typecheck
```

Manual smoke for deploys remains in [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md) (`/ready`, rate-limit 429, CORS).
