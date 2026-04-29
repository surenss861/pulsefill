# PulseFill marketplace foundation QA

Run after **`0020_marketplace_foundation.sql`** is applied in Supabase. Proves directory + memberships + operator requests before adding payments or more marketplace UX.

## Migration

- [ ] `0020_marketplace_foundation.sql` applied in Supabase
- [ ] `businesses` has `standby_access_mode`
- [ ] `businesses` has `customer_discovery_enabled`
- [ ] `customer_business_memberships` exists
- [ ] `customer_standby_requests` exists

## Invite path regression

- [ ] Customer accepts invite
- [ ] `customer_business_memberships` row exists with `source = invite`
- [ ] Standby setup still works
- [ ] Offer → claim → confirm still works

## Directory flow (iOS Find + API)

- [ ] Discoverable business appears in iOS Find tab
- [ ] Non-discoverable business does not appear
- [ ] Business detail loads locations / services
- [ ] Private business shows invite-only copy (no join CTA)
- [ ] Request-to-join business allows request
- [ ] Public business allows direct standby join

## Operator flow (dashboard)

- [ ] Pending request appears on `/customers/standby-requests`
- [ ] Sidebar **Customers** badge count when pending > 0
- [ ] Command Center callout when pending > 0
- [ ] **Approve** creates active membership
- [ ] **Decline** updates request status
- [ ] Approved customer can set standby preferences

## Regression

- [ ] Existing dashboard pages still load
- [ ] Existing customer invite flow still works
- [ ] Original smoke loop still passes

---

**Recommendation:** Finish this QA before payments, take rate, or heavy Phase 2 UX. After QA, prioritize **guiding new members (public / approved request) into standby preferences** if anything feels sticky.
