# Full-loop smoke runbook (operator + customer + intelligence)

Use this when you need a **repeatable, evidence-friendly** pass across API, dashboard, and iOS after meaningful changes (migrations, auth, notifications, outcomes, coverage drilldowns, opening create prefill, etc.).

**Goal:** produce one run record with **environment, commit, URLs, identities, step outcomes, and the first failing artifact** so the next fix is scoped and the loop can be re-run the same way.

---

## Related artifacts (do not duplicate blindly)

| Doc | Use for |
|-----|---------|
| [SMOKE_RUN_LOG.md](./SMOKE_RUN_LOG.md) | Short **12-step** loop + “first failure only” log block |
| [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md) | **`pnpm smoke:api`**, CORS, deploy order |
| `../ios/PulseFill/docs/CUSTOMER_FLOW_SMOKE_TEST.md` | Customer invite → standby → offer → claim detail |
| `../ios/PulseFill/docs/IOS_OPERATOR_QA_CHECKLIST.md` | Operator flows on iOS (if in scope) |
| [operator-qa-bug-bash-checklist.md](./operator-qa-bug-bash-checklist.md) | Deep dashboard queue / slot states |

**Blank run template (copy per session):** [../scripts/smoke-full-loop-template.md](../scripts/smoke-full-loop-template.md)

---

## 0 — Run header (fill before touching the product)

Copy into `scripts/smoke-full-loop-template.md` (or your ticket) and keep it open for the whole run.

| Field | Example / notes |
|--------|------------------|
| **Date / timezone** | |
| **Runner** | |
| **Environment** | `local` · `staging` · `production` |
| **Git commit** | `git rev-parse HEAD` |
| **API base URL** | e.g. `http://127.0.0.1:3001` or Railway URL |
| **Dashboard base URL** | e.g. `http://localhost:3000` — must match `API_CORS_ORIGINS` when not local |
| **Worker** | Running? Version/commit same as API? |
| **iOS build config** | Scheme, `PULSEFILL_TIER`, `PULSEFILL_API_BASE_URL`, simulator vs device |
| **Supabase project** | Which project (URL / ref); migrations applied through which file |
| **Business used** | Name + `business_id` (from staff session or DB) |
| **Staff identity** | How signed in (Supabase vs dev token) |
| **Customer used** | Invite email + `customer_id` after accept (if applicable) |

**Automated gates (recommended before manual steps)**

From repo root `pulsefill/`:

```bash
pnpm typecheck
pnpm --filter @pulsefill/api test
# Optional deploy/API surface check:
export PULSEFILL_API_BASE_URL="https://YOUR_API"
pnpm smoke:api
```

Record pass/fail and command output paths in the run template.

---

## 1 — Phase A: Workspace setup (dashboard)

| Step | Action | Pass/Fail | Notes / artifact |
|------|--------|-----------|------------------|
| A1 | Staff sign-in | | |
| A2 | **Locations** — at least one active location | | |
| A3 | **Providers** — at least one provider | | |
| A4 | **Services** — at least one service; open **Coverage** for one service (`/services/coverage/{id}`) | | |
| A5 | Command Center / overview loads without hard error | | |

Stop on first failure; capture **screen + network tab + API response** for that step.

---

## 2 — Phase B: Opening lifecycle (dashboard)

| Step | Action | Pass/Fail | Notes / artifact |
|------|--------|-----------|------------------|
| B1 | **Create opening** — plain `/open-slots/create` | | |
| B2 | **Create opening — query prefill** — `/open-slots/create?service_id=<valid-uuid>` (and optionally `location_id`, `provider_id`) | | Confirm banner + selects match catalog |
| B3 | Opening appears in **Open slots** list | | |
| B4 | **Open slot detail** — loads queue context, actions sensible for state | | |
| B5 | **Send offers** (or intentional no-match path) | | |
| B6 | If no-match: **Why no one matched** / retry guidance / timestamps coherent | | |

---

## 3 — Phase C: Customer path (iOS per `CUSTOMER_FLOW_SMOKE_TEST`)

| Step | Action | Pass/Fail | Notes / artifact |
|------|--------|-----------|------------------|
| C1 | Create / send **customer invite** (dashboard) | | |
| C2 | iOS sign-in with invited email | | |
| C3 | Accept invite + **standby preferences** complete | | |
| C4 | Customer sees **offer** when operator sent offers | | |
| C5 | **Claim** from customer | | |

---

## 4 — Phase D: Recovery intelligence (dashboard)

| Step | Action | Pass/Fail | Notes / artifact |
|------|--------|-----------|------------------|
| D1 | **Outcomes** — scorecards + lists load | | |
| D2 | **What PulseFill is learning** (recovery insights block) | | |
| D3 | From thin service → **Service coverage drilldown** | | |
| D4 | **Create opening for this service** from drilldown → create form pre-filled | | |

---

## 5 — Phase E: Close the loop (operator)

| Step | Action | Pass/Fail | Notes / artifact |
|------|--------|-----------|------------------|
| E1 | Operator sees claim / **confirm booking** | | |
| E2 | Slot terminal state correct; **Activity / outcomes** reflect the win | | |

---

## 6 — Run result (required closing block)

Fill **once** at end of attempt:

| | |
|--|--|
| **Overall** | `PASS` / `FAIL` |
| **First failing phase.step** | e.g. `B5` |
| **First failing artifact** | One of: screenshot path, HAR, `curl` response, log line, DB row identifier |
| **Suspected layer** | `API` / `dashboard` / `iOS` / `DB` / `worker` / `env` |
| **Follow-up** | Ticket / PR link |

If **FAIL**: do not continue the checklist for “credit”; fix the seam, then **re-run from phase A** or from the minimum safe re-entry point.

---

## 7 — Optional: No-match → create deep links (when safe)

When the product exposes stable slot-level `service_id` / `location_id` / `provider_id` in no-match UI (not only aggregate reasons), add smoke steps that assert:

- Service mismatch → `/open-slots/create?service_id=…`
- Location / provider mismatch → same pattern with `location_id` / `provider_id`

Until then, treat those links as **out of scope** for this runbook.

---

## Quick reference: env vars

| Surface | Variable | See |
|---------|----------|-----|
| Dashboard → API | `NEXT_PUBLIC_PULSEFILL_API_URL` | `apps/dashboard-web/.env.example`, `env.railway.example` |
| API CORS | `API_CORS_ORIGINS` | `env.railway.example`, [railway.md](./railway.md) |
| iOS → API | `PULSEFILL_API_BASE_URL`, `PULSEFILL_TIER` | `env.railway.example` |
| API automated smoke | `PULSEFILL_API_BASE_URL`, `PULSEFILL_DASHBOARD_ORIGIN` | [DEPLOYMENT_SMOKE_CHECKLIST.md](./DEPLOYMENT_SMOKE_CHECKLIST.md) |

API integration tests use fixed UUIDs when `PULSEFILL_API_TEST=1` (see `apps/api` test helpers); **do not** assume those IDs exist in a real Supabase project unless you seeded them.
