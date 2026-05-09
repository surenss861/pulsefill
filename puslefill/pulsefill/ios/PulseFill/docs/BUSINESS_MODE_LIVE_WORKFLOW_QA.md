# PulseFill Real-Data QA + Demo Recovery Loop

Use this runbook after UI polish to validate the production story with realistic seeded data.

## Goal

Prove the full recovery loop is trustworthy with real data and real refreshes:

1. Business creates opening
2. Business sends offers
3. Customer sees offer
4. Customer claims opening
5. Business confirms booking
6. Customer + Business surfaces refresh to the correct final state

## Seed realistic demo data

From repo root:

```bash
pnpm seed:demo
```

Required env in `apps/api/.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_STAFF_AUTH_USER_ID` (auth user UUID for your operator login)

Seed source: `apps/api/scripts/seed-demo-workspace.ts`

The script prints a JSON summary to stdout. Use `customers.reachable.email` and `customers.reachable.password` to sign in as the seeded customer on iOS (that account owns the pre-seeded offers/claims tied to the demo loop).

### Demo dataset includes

- Business: `Luxe Wellness Studio`
- 2 locations + 2 providers
- Services:
  - `Lash refill`
  - `Botox consultation`
  - `Massage therapy`
  - `Dental cleaning`
  - `Physio follow-up`
- 5 customer profiles with varied reachability/preferences
- Slot states:
  - `open` (with no-match audit context)
  - `offered`
  - `claimed` (pending confirmation)
  - `booked`
  - `expired`
  - `cancelled`
- Pending invite + invite token/code
- Delivery/notification attempts
- Customer notes + follow-up context

## iOS launch config

In Xcode Run scheme env:

- `PULSEFILL_SUPABASE_URL=https://<project-ref>.supabase.co`
- `PULSEFILL_SUPABASE_ANON_KEY=<anon/public key>`
- `PULSEFILL_API_BASE_URL=<Fastify API URL>`

## Demo recovery loop (manual)

Use one operator account mapped to `DEMO_STAFF_AUTH_USER_ID` and one seeded customer.

### A) Auth + role routing

- [ ] Operator sign-in succeeds
- [ ] Operator routes to Business mode (or role picker when dual-role)
- [ ] Customer sign-in routes to Customer shell

### B) Business creates and sends

- [ ] Business mode -> `Create` -> add opening
- [ ] Opening detail shows success banner and action controls
- [ ] `Send offers` succeeds with clear feedback

### C) Customer sees and claims

- [ ] Customer `Openings` shows seeded offers
- [ ] Customer can open offer detail
- [ ] `Claim opening` succeeds with success feedback
- [ ] Offer detail/activity copy reflects waiting-for-business state

### D) Business confirms

- [ ] Business `Claims` shows the newly claimed opening
- [ ] `Confirm booking` succeeds
- [ ] Claim moves from waiting -> confirmed/finished section correctly

### E) Post-confirm consistency

- [ ] Customer sees confirmed state in Offer Detail + Activity
- [ ] Business Today/Openings/Claims all show correct final status
- [ ] No stale rows or contradictory statuses remain after pull-to-refresh

## Refresh correctness matrix

Validate these updates after each mutation:

- [ ] Create opening -> Today + Openings update
- [ ] Send offers/retry offers -> Detail + Today + Openings update
- [ ] Customer claim -> Business Claims + Today update
- [ ] Confirm booking -> Claims + Openings + Today + Customer Activity update
- [ ] Expire/cancel -> Today + Openings + Detail update
- [ ] Create/revoke invite -> Customers update and remains coherent after refresh

## Confidence checks

- [ ] Status labels are accurate and human-readable (not backend jargon)
- [ ] Success/failure messages are clear and action-oriented
- [ ] Empty/error states always suggest the next step
- [ ] Haptics/motion feel subtle and confidence-building (no noisy feedback)

## Pass/fail criteria

Fail on the first blocker that breaks operator/customer trust:

- incorrect status transition
- stale data after mutation
- missing refresh propagation
- confusing action outcome
- conflicting state between Customer and Business views

Capture for each failure:

- action performed
- expected vs actual
- screenshot/log line
- likely layer (`iOS` / `API` / `DB` / `env`)
