# App Store submission notes (draft)

Paste the relevant sections into App Store Connect. Fill in `[TODO]` placeholders before submitting.

---

## App Store Connect metadata

**App name:** PulseFill

**Subtitle** (30 chars): Fill cancelled openings fast

**Promotional text** (170 chars, optional):
Get earlier appointments the moment they open up — join a business's standby list and PulseFill notifies you the instant a cancellation opens a spot.

**Description** (customer-facing app):
```
PulseFill helps you get earlier appointments. Join a business's standby
list, tell us what times and services work for you, and we'll notify you
the moment a cancellation opens up a matching spot.

- Join with an invite code or find businesses directly in the app
- Set standby preferences — service, provider, location, and time window
- Get a push notification the instant a matching opening appears
- Claim it in the app — first valid claim wins
- Track every claim and booking in your activity feed

For businesses: PulseFill also includes tools to post cancelled openings,
notify your waiting list automatically, and confirm bookings — turning
lost appointment slots into recovered revenue.
```

**Keywords** (100 chars): appointments,booking,waitlist,cancellation,standby,scheduling,salon,clinic,recovery

**Support URL:** `https://[TODO-marketing-domain]/support`
**Marketing URL:** `https://[TODO-marketing-domain]`
**Privacy Policy URL:** `https://[TODO-marketing-domain]/privacy`

**Category:** Business (primary) / Lifestyle or Medical (secondary, depending on target verticals)

**Age rating:** 4+ (no objectionable content; confirm via App Store Connect questionnaire)

---

## Demo account for review

App Review needs to reach both the customer flow and, if reviewed, the business flow without your production data.

- **Customer demo:** `[TODO: demo customer email]` / `[TODO: password]` — pre-loaded with an active standby preference and at least one historical claim so Activity isn't empty.
- **Business demo (if in scope for this submission):** `[TODO: demo staff email]` / `[TODO: password]` — pre-loaded with a location, provider, service, and one open slot so Today isn't an empty setup state.
- Reset demo data before each submission cycle so reviewers see a realistic, non-broken state (see Phase 7 admin tooling for a scripted reset once built).

## Review notes (paste into the "Notes" field)

```
PulseFill matches customers on a business's standby list with cancelled
appointment openings.

Push notifications: used to alert a customer when a matching opening
becomes available, and to notify a customer when their booking is
confirmed. No location services are used.

Payments: some businesses charge for claimed openings. Payment is
authorized via Stripe at claim time and only captured once the business
confirms the booking; if not confirmed, the authorization is released
automatically and the customer is not charged. PulseFill uses Stripe's
standard PaymentSheet for card entry — no card data is handled by
PulseFill directly.

Account deletion: Profile → Account → Delete account. This immediately
scrubs the customer's name, email, and phone number, deactivates their
push devices and standby preferences, deletes their auth credentials,
and signs them out. This is implemented natively in-app per guideline
5.1.1(v) (no external site required).

To test the core loop: sign in with the demo customer above, or use the
business demo account (dashboard, not in this binary) to create an
opening and send offers, then claim it as the customer and confirm as
the business.
```

---

## Screenshots checklist

Capture on a real device or the latest simulator, per current App Store size requirements (6.9" and 5.5" display sets at minimum):

- [ ] Offers inbox (customer) — shows an active offer
- [ ] Offer detail with claim button
- [ ] Claim outcome / confirmation screen
- [ ] Standby preferences setup
- [ ] Activity feed with a mix of states (claimed, confirmed, expired)
- [ ] Business Today / operator overview (if business-facing screenshots are in scope)
- [ ] Paid-claim PaymentSheet moment (once Stripe Connect is live in a demo business)

## Pre-submission technical checklist

- [ ] `PulseFill-Release.entitlements` (`aps-environment=production`) is the entitlements file used by the Release/Archive build configuration — confirmed in `PulseFill.xcodeproj`; verify the exported archive's embedded entitlements in Xcode Organizer before upload.
- [ ] `PulseFillReleaseOverrides.xcconfig` has real production Supabase URL, anon key, and API base URL (not placeholders — `PulseFillBuildConfiguration.evaluateLaunchConfiguration` will block launch on placeholder values, which is a safety net, not something to rely on for catching this).
- [ ] `PrivacyInfo.xcprivacy` present at the app target root (added — declares email/phone/name/user ID/device ID/payment info/other user content, all "app functionality" purpose, no tracking; `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1`). Re-review if new required-reason APIs are added later (file timestamps, disk space, system boot time).
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_CONNECT_PLATFORM_FEE_BPS` / `ENABLE_CONNECT_ROUTES` set on the **api** Railway service before any paid-claim screenshots or demo flows are recorded.
- [ ] Account deletion tested end-to-end against the production API before submission (not just staging).
