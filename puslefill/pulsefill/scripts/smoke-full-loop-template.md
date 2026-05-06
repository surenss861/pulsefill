# Full-loop smoke run — copy this file per attempt

Rename to e.g. `smoke-run-2026-04-30-staging.md` or paste into Linear / Notion.

---

## Run metadata

| Field | Value |
|-------|-------|
| Date / TZ | |
| Runner | |
| Environment | `local` / `staging` / `prod` |
| Git commit (`git rev-parse HEAD`) | |
| API URL | |
| Dashboard URL | |
| Worker running? (y/n) + notes | |
| iOS: scheme / `PULSEFILL_TIER` / `PULSEFILL_API_BASE_URL` / device vs simulator | |
| Supabase project (ref or URL) | |
| Migrations applied through (file or version) | |
| Business (name + `business_id`) | |
| Staff sign-in method | |
| Customer invite email | |
| Customer `customer_id` (after accept) | |

---

## Automated gates (before manual loop)

| Command | Pass/Fail | Log / output path |
|---------|-----------|-------------------|
| `pnpm typecheck` | | |
| `pnpm --filter @pulsefill/api test` | | |
| `pnpm smoke:api` (if used) | | |

---

## Phase results

| Phase | Pass/Fail | Notes |
|-------|-----------|-------|
| A — Workspace setup | | |
| B — Opening lifecycle | | |
| C — Customer path (iOS) | | |
| D — Recovery intelligence | | |
| E — Close loop (confirm / outcomes) | | |

---

## First failure (fill only if FAIL)

| Field | Value |
|-------|-------|
| Phase.step | |
| Expected | |
| Actual | |
| First failing artifact | (screenshot path, HAR, response JSON snippet, log line, row id) |
| Suspected layer | API / dashboard / iOS / DB / worker / env |

---

## Overall

| Overall | `PASS` / `FAIL` |
|---------|-----------------|
| Follow-up ticket / PR | |
