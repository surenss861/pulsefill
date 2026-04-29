# Marketplace → offer eligibility QA

Use after `0020_marketplace_foundation.sql` is applied and the **send-offers** response includes `match_summary` (API deployed).

## Setup

- [ ] Business has discovery enabled (if testing directory path).
- [ ] Customer has **active** `customer_business_memberships` for the business (`source` invite / request / public does not matter).
- [ ] Customer has **active** `standby_preferences` with `business_id` matching the opening.
- [ ] Opening service/location/time fits the preference (or preference uses broad nulls / “any” where allowed).

## Public path

- [ ] Customer joins from Find (public) → membership active.
- [ ] Customer saves standby preference → `active = true`.
- [ ] Operator creates opening aligned with preference.
- [ ] Send offers → `offers_created` > 0, customer receives offer, iOS inbox shows it.
- [ ] Claim → confirm still works.

## Request path

- [ ] Customer requests → operator approves → membership active.
- [ ] Customer saves preference → send offers → same as above.

## No-match visibility (operator)

- [ ] Send offers with **no** active preferences → API `result: no_matches`, `no_matches_reason: no_active_preferences`, friendly message.
- [ ] Send offers with prefs but **no membership** → `match_summary.rejected.no_active_membership` increments; operator sees “checked N preferences” hint.
- [ ] Send offers with wrong service vs opening → `service_mismatch` counts in `match_summary.rejected`.
- [ ] Audit event `offers_no_match` includes `match_summary` and a capped `match_diagnostics` sample for debugging.

## Regression

- [ ] Invite-only customer with membership + prefs still receives offers.
- [ ] Bulk **retry offers** uses the same matcher + membership rules as single send.
