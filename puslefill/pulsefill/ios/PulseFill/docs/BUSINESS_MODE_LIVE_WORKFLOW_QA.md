# Business Mode Live Workflow QA

Use this after shell/copy polish to validate the real operator loop with realistic data.

## Goal

Prove the end-to-end Business loop feels obvious and trustworthy:

1. Add empty appointment
2. Send offers
3. Customer claims
4. Operator confirms booking
5. Today/Openings/Claims/Customers refresh correctly

## Seed realistic data

From repo root:

```bash
pnpm seed:demo
```

Required env in `apps/api/.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_STAFF_AUTH_USER_ID` (auth user UUID for your operator login)

Notes:

- Script: `apps/api/scripts/seed-demo-workspace.ts`
- Creates one business workspace with:
  - 2 locations
  - 2 providers
  - 5 realistic services (`Dental cleaning`, `Lash refill`, `Physio follow-up`, `Hair colour touch-up`, `Botox consultation`)
  - 5 waiting customers
  - statuses across openings (`open`, `offered`, `claimed`, `booked`, `expired`)
  - pending invite + customer notes + notifications/delivery attempts for context

## iOS launch config (Business shell)

In Xcode Run scheme env:

- `PULSEFILL_SUPABASE_URL=https://<project-ref>.supabase.co`
- `PULSEFILL_SUPABASE_ANON_KEY=<anon/public key>`
- `PULSEFILL_API_BASE_URL=<Fastify API URL>`

## Smoke steps (manual)

Use one operator account tied to `DEMO_STAFF_AUTH_USER_ID`.

### A) Today

- [ ] Hero tells the workflow in one glance
- [ ] Metrics/Tasks reflect seeded slot states
- [ ] Empty/error state explains what happened + what to do next

### B) Create -> Opening detail

- [ ] Create an opening in under 30 seconds
- [ ] Success banner appears on detail
- [ ] `Send offers now` moves focus to action controls
- [ ] Success haptic fires once

### C) Openings

- [ ] Row hierarchy is clear: status -> time -> context -> next action
- [ ] Primary action is obvious
- [ ] Filter empty state suggests changing filters

### D) Claims

- [ ] Claimed slot is easy to spot
- [ ] Confirm dialog copy is plain and clear
- [ ] Confirm success moves claim to correct section/state

### E) More -> Customers / Account

- [ ] More stays branded (no default white list feel)
- [ ] Customers screen explains why the waiting list matters
- [ ] Account screen clearly shows workspace + mode + sign-out

## Refresh correctness matrix

Validate these surface updates after each mutation:

- [ ] Create opening -> Openings + Today update
- [ ] Send offers -> Opening detail + Today update
- [ ] Claim arrives -> Claims + Today update
- [ ] Confirm booking -> Claims + Openings + Today update
- [ ] Expire/cancel -> Openings + Today update
- [ ] Create/revoke invite -> Customers + Today update

## Pass/fail criteria

Mark FAIL on the first blocker that breaks confidence:

- wrong status/state transition
- stale data after mutation
- unclear next action
- screen feels inconsistent with Business shell

Capture:

- action performed
- expected vs actual result
- screenshot/log line
- likely layer (`iOS` / `API` / `DB` / `env`)
