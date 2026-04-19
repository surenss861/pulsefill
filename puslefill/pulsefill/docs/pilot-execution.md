# PulseFill pilot execution (printable checklist)

Use **Railway staging** + **one pilot business**. Do not advance a day if core flows are red.

---

## Day 0 — Pre-flight

### Infra

- [ ] Railway API deployed; `GET /health` OK
- [ ] Railway worker running; Redis connected
- [ ] Migrations **0001–0008** applied in Supabase
- [ ] `open_slots` in `supabase_realtime` (see `docs/supabase-realtime-rls.md`)
- [ ] RLS policies for staff reads verified
- [ ] Dashboard: `NEXT_PUBLIC_PULSEFILL_API_URL`, `NEXT_PUBLIC_SUPABASE_*` match the same project as production/staging intent
- [ ] iOS staging points at same API + Supabase as dashboard

### Accounts & data

- [ ] One **staff** test user; `staff_users.auth_user_id` = Supabase Auth user id
- [ ] Business, location, provider, service exist
- [ ] One **customer** test user

### Sanity

- [ ] Dashboard login / logout
- [ ] iOS login; session survives relaunch
- [ ] Internal dry-run slot → offer → claim → confirm once (optional before Day 1)
- [ ] Optional: quick **UI polish pass** — `docs/ui-polish-qa.md` (~10–15 min) after Xcode build

---

## Day 1 — Internal dry run

### Staff

- [ ] Create open slot → appears in list → detail loads
- [ ] Send / retry offers → toast + timeline + notification logs
- [ ] Claims page shows claimed slot after customer claims
- [ ] Confirm booking → success toast → slot `booked`

### Customer (iOS)

- [ ] Standby preference (if used)
- [ ] Offers inbox → detail → claim → result screen → Activity

### Observability

- [ ] API / worker logs clean
- [ ] Rows in `open_slots`, `slot_offers`, `slot_claims`, `notification_logs`, `audit_events`

**Pass:** full loop **twice** without stuck state.

---

## Day 2 — Failure paths

- [ ] Lost race / duplicate claim → human-readable copy
- [ ] Expire path: offers expire; slot/audit consistent
- [ ] Signed-out dashboard → `/login`
- [ ] No push device → notification log reason readable
- [ ] No standby matches → “No matching standby customers yet.”

**Pass:** failures are readable; no corrupt rows.

---

## Day 3 — Realtime + refresh

- [ ] Claims page updates when `open_slots` changes (Realtime or ≤15s poll)
- [ ] Slot detail updates (Realtime or ≤12s poll)
- [ ] Sidebar live counts plausible

Optional: `NEXT_PUBLIC_REALTIME_DEBUG=true` and confirm console logs.

---

## Day 4 — Real device push

- [ ] Physical iPhone; push capability; token in `customer_push_devices`
- [ ] Send offers → worker → notification log → (when APNs wired) device receives tap → Offers flow

---

## Day 5 — First pilot business setup

- [ ] One business only: org, location, providers, services, staff
- [ ] Staff can log in on their machine
- [ ] Operator can repeat the one-sentence script (slot → offers → claim → confirm; detail + claims pages)

---

## Day 6 — Shadow mode

- [ ] Parallel to normal ops; note confusion / manual workarounds
- [ ] No broad customer blast yet

---

## Day 7 — Controlled live

- [ ] Subset of cancellations; hours you can monitor; one main operator
- [ ] Running log: time, slot, offers, claim, confirm, expiry, notes

---

## Smoke test matrix (staging)

| Area | Check |
|------|--------|
| Auth | Staff + customer sign-in; guarded routes |
| Slots | Create, list, detail, retry offers |
| Worker | Notification job; expiry job |
| Customer | Inbox, claim, result, activity |
| Staff | Claims, confirm, toasts |
| Realtime | Or polling fallback acceptable |
| UX | Toasts, chips, no raw errors in happy path |

---

## Go / no-go gates

Ship pilot only if all true:

- [ ] Claim → confirm loop reliable
- [ ] Expiry loop reliable
- [ ] Dashboard + iOS auth stable
- [ ] Push registration works on real device (or simulated path understood)
- [ ] Errors human-readable
- [ ] Realtime works **or** polling verified acceptable

---

## Issue log template

| Issue | Severity | Where | Repro? | Fixed? | Notes |
|-------|----------|-------|--------|--------|-------|

---

## Operator one-liner

“PulseFill recovers cancelled appointments: create the open slot, send offers, when someone accepts you confirm on Claims. Slot detail shows timeline and notification logs.”

## Customer one-liner

“Turn on notifications and set standby preferences. If a cancelled slot matches you, we’ll notify you—first valid claim wins.”
