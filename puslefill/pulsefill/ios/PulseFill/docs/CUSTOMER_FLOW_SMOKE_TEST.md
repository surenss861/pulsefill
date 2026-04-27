# PulseFill Customer Flow Smoke Test

End-to-end verification of the customer product loop (offer → open app → claim → status → activity).

## Setup

- [ ] Customer account exists
- [ ] Customer has active APNs token in backend
- [ ] Customer notification permission is granted
- [ ] Business has a future open slot
- [ ] Customer is eligible for an offer
- [ ] API is running with expected `PUSH_PROVIDER` value

## Optional local seed

From `apps/api`:

```bash
pnpm seed:customer-flow
pnpm seed:customer-flow -- --claim --push --attempt
```

Use the generated email/password to sign into the iOS app.

Notes:

* Requires local Supabase running.
* Refuses non-local Supabase unless `PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED=1` is set.
* `--claim` creates a claimed state.
* `--push` creates an active fake APNs token.
* `--attempt` creates a notification attempt row for diagnostics.

For a **noop** smoke pass (active offer on Home/Offers, push row + attempt for API/diagnostics), prefer:

```bash
pnpm seed:customer-flow -- --push --attempt
```

Then sign in with the printed credentials and run the checklist sections below.

## Offer delivery

- [ ] Operator sends offers
- [ ] Customer offer row is created
- [ ] Notification attempt row is created
- [ ] Attempt status is sent/suppressed/failed with readable reason
- [ ] Slot Detail diagnostics shows notification attempt (operator)

## Customer app

- [ ] Home shows active offer spotlight (cream when claimable)
- [ ] Offers tab shows claimable offers first
- [ ] Offer detail opens cleanly
- [ ] Claim CTA is reachable and correct
- [ ] Expired/unavailable state does not allow claim

## Claim

- [ ] Claim succeeds
- [ ] Button enters busy state (if wired)
- [ ] Duplicate taps are blocked where implemented
- [ ] UI changes to Claim submitted / awaiting confirmation as appropriate
- [ ] Activity shows claim-related update
- [ ] Operator queue/detail reflects pending confirmation

## Confirmation

- [ ] Operator confirms booking
- [ ] Customer status updates to Booking confirmed (presenter labels)
- [ ] Activity shows booking confirmed
- [ ] Notification attempt is recorded for confirmation push (if applicable)
- [ ] Offer no longer appears as claimable on Home/Offers

## Sign out / push token

- [ ] Sign out deactivates APNs token (when implemented)
- [ ] Re-sign-in registers/reuses active token

## Provider modes

### Noop / test first

- [ ] Run with `PUSH_PROVIDER=noop` (or equivalent) and confirm offer + claim flow without requiring real APNs delivery

### APNs sandbox (after noop passes)

- [ ] Run with `PUSH_PROVIDER=apns` and `APNS_ENVIRONMENT=sandbox` on a physical device with a valid token
