# Pilot-state QA checklist (operator + customer)

Structured manual pass for **web operator**, **iOS operator**, and **customer** flows after the action-contract + CTA hardening work. Use with staging (or local) API + dashboard + iOS pointed at the same backend.

**Related:** infra and day-by-day pilot steps live in [`pilot-execution.md`](./pilot-execution.md). UI-only polish: [`ui-polish-qa.md`](./ui-polish-qa.md).

---

## How to use this doc

1. Complete **Environment** below once.
2. For each scenario, run steps in order on the surfaces indicated.
3. For every failure, log a row in **Issue log** (copy the table row to your sheet).

### Severity

| Label | Meaning |
|-------|--------|
| **P0** | Wrong booking state, dangerous trust bug, or data integrity risk |
| **P1** | Action broken, misleading CTA, or error that blocks work |
| **P2** | Stale UI, metrics mismatch, confusing copy, filter edge case |
| **P3** | Polish only |

---

## Environment (fill in once)

| Field | Value |
|-------|--------|
| API base URL | |
| Dashboard URL | |
| iOS build / branch | |
| Test business name | |
| Staff account | |
| Customer account | |
| Date of run | |
| Tester | |

---

## Scenario 1 — Golden path (create → offer → claim → confirm)

**Surfaces:** web slots → customer claim → iOS (or web) confirm → verify web + iOS + metrics.

| Step | Action | Web | iOS op | Customer | Pass? | Notes |
|------|--------|-----|--------|----------|-------|-------|
| 1.1 | Create open slot; appears in list with status `open` | ☐ | ☐ | — | ☐ | |
| 1.2 | Send offers; success toast/message; slot → `offered` where applicable | ☐ | ☐ | — | ☐ | |
| 1.3 | Customer claims; slot → `claimed` | — | — | ☐ | ☐ | |
| 1.4 | Queue shows **awaiting confirmation** (needs action) | ☐ | ☐ | — | ☐ | |
| 1.5 | Confirm booking; success copy from API; slot → `booked` | ☐ | ☐ | — | ☐ | |
| 1.6 | Claim no longer awaiting; queue/slots/claims lists coherent | ☐ | ☐ | — | ☐ | |
| 1.7 | Daily metrics / overview: recovered bookings + revenue move sensibly | ☐ | ☐ | — | ☐ | |

---

## Scenario 2 — No matches

**Setup:** slot with no matching standby preferences (or business with zero matches).

| Step | Action | Web | iOS op | Pass? | Notes |
|------|--------|-----|--------|-------|-------|
| 2.1 | Send offers; API success (not 5xx); message reflects **no matches** | ☐ | ☐ | ☐ | |
| 2.2 | No fake “failure” toast; queue/review shows **no matches** if applicable | ☐ | ☐ | ☐ | |
| 2.3 | Retry/send only if slot still `open` or `offered`; terminal slots reject with mapped error | ☐ | ☐ | ☐ | |

---

## Scenario 3 — Delivery failure / flaky delivery

**Setup:** force failed or simulated notification (env-dependent).

| Step | Action | Web | iOS op | Pass? | Notes |
|------|--------|-----|--------|-------|-------|
| 3.1 | Slot detail **delivery summary** / logs reflect failures | ☐ | ☐ | ☐ | |
| 3.2 | Action queue surfaces delivery issue; primary CTA not lying (inspect vs retry) | ☐ | ☐ | ☐ | |
| 3.3 | Customer context (if open): delivery readiness readable | ☐ | ☐ | — | ☐ | |

---

## Scenario 4 — Already confirmed (idempotent)

| Step | Action | Web | iOS op | Pass? | Notes |
|------|--------|-----|--------|-------|-------|
| 4.1 | Confirm a **claimed** slot successfully once | ☐ | ☐ | ☐ | |
| 4.2 | From a **stale** screen (no refresh), confirm again | ☐ | ☐ | ☐ | |
| 4.3 | Expect **200** + honest **already confirmed** style message; no generic “Action failed” | ☐ | ☐ | ☐ | |
| 4.4 | Refresh; UI matches **booked** everywhere | ☐ | ☐ | ☐ | |

---

## Scenario 5 — Stale claim / claim mismatch

| Step | Action | Web | iOS op | Pass? | Notes |
|------|--------|-----|--------|-------|-------|
| 5.1 | Open same slot on two surfaces; advance state on one | ☐ | ☐ | ☐ | |
| 5.2 | Confirm from stale surface | ☐ | ☐ | ☐ | |
| 5.3 | Expect **mapped** error (`claim_mismatch` / `slot_not_claimed` / etc.); refresh recovers | ☐ | ☐ | ☐ | |

---

## Scenario 6 — Terminal slot: send / retry / confirm

| Step | Action | Web | iOS op | Pass? | Notes |
|------|--------|-----|--------|-------|-------|
| 6.1 | **Booked** slot: send/retry returns mapped error; no misleading inline CTA after refresh | ☐ | ☐ | ☐ | |
| 6.2 | **Expired** / **cancelled**: confirm/send return mapped error | ☐ | ☐ | ☐ | |
| 6.3 | Queue row for that slot does not offer impossible inline action (after refresh) | ☐ | ☐ | ☐ | |

---

## Scenario 7 — Filters & saved views (web)

| Step | Action | Pass? | Notes |
|------|--------|-------|-------|
| 7.1 | Open slots: filter by provider / location / service; list matches | ☐ | |
| 7.2 | Run inline action inside filtered list; row updates or drops correctly | ☐ | |
| 7.3 | Saved view save + apply + delete | ☐ | |
| 7.4 | Action queue: same filters; counts believable after action | ☐ | |

---

## Scenario 8 — iOS filters (if enabled)

| Step | Action | Pass? | Notes |
|------|--------|-------|-------|
| 8.1 | Slots: filter persistence across relaunch | ☐ | |
| 8.2 | Queue: filter persistence; actions still valid | ☐ | |

---

## Scenario 9 — Metrics & overview consistency

| Step | Action | Pass? | Notes |
|------|--------|-------|-------|
| 9.1 | After confirm: daily ops / overview numbers move as expected | ☐ | |
| 9.2 | Ops breakdown (if used): provider/service/location not obviously wrong | ☐ | |
| 9.3 | Delivery reliability card: counts plausible vs notification reality | ☐ | |

---

## Scenario 10 — Customer context (slot detail with winner)

| Step | Action | Web | iOS op | Pass? | Notes |
|------|--------|-----|--------|-------|-------|
| 10.1 | Masked email/phone; standby prefs scoped to business | ☐ | ☐ | ☐ | |
| 10.2 | Delivery readiness lines make sense | ☐ | ☐ | ☐ | |
| 10.3 | Empty/error states don’t crash layout | ☐ | ☐ | ☐ | |

---

## Cross-surface parity (spot check)

| Check | Web | iOS op | Match? |
|-------|-----|--------|--------|
| Same error **code** → same operator-facing meaning | ☐ | ☐ | ☐ |
| Success messages prefer **API `message`** when present | ☐ | ☐ | ☐ |
| Queue primary CTA: no **Retry** on `view_slot`-first rows | ☐ | ☐ | ☐ |

---

## Polling / refresh sanity

After any inline action, within ~15–30s (or manual refresh):

| Check | Pass? |
|-------|-------|
| Queue poll or refresh shows updated state | ☐ |
| Slots list/detail consistent | ☐ |
| Claims list consistent | ☐ |
| iOS flash message cleared on next action / not stuck | ☐ |

---

## Issue log (copy rows to spreadsheet)

| # | Date | Scenario | Surface | Steps | Expected | Actual | Severity | Owner |
|---|------|----------|---------|-------|----------|--------|----------|-------|
| 1 | | | | | | | | |
| 2 | | | | | | | | |

---

## Sign-off

| Question | Yes / No |
|----------|----------|
| Any **P0** open? | |
| Any **P1** open? | |
| OK for pilot demo after fixes? | |

**Tester signature / date:** _________________________
