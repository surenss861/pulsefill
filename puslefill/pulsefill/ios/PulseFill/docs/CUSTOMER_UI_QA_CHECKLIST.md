# PulseFill Customer UI QA Checklist

For offer/claim states, use `pnpm seed:customer-flow` from `apps/api` to create predictable customer test data (see **Optional local seed** in `CUSTOMER_FLOW_SMOKE_TEST.md`).

## Auth Landing

- [ ] Landing fits without clipping on small iPhones
- [ ] Appointment pass rotates smoothly
- [ ] Reduce Motion disables rotation
- [ ] Sign in opens SignInView
- [ ] I have an invite opens SignUpView
- [ ] No signed-out tab shell appears
- [ ] No operator/revenue/recovery language appears

## Home

- [ ] Active offer appears as cream spotlight card
- [ ] No active offer shows calm empty state
- [ ] Expired/unavailable offers do not become main spotlight
- [ ] Claimed/confirmed (when no claimable) shows dark “Opening update” card with correct CTA label
- [ ] Standby active state is clear
- [ ] Standby not set up state has clear CTA
- [ ] Recent activity shows human labels (presenter titles + detail lines)
- [ ] Loading state looks intentional
- [ ] Error state has retry
- [ ] No raw backend statuses appear

## Offers

- [ ] Claimable offers sort first
- [ ] Past/expired offers are visually quieter
- [ ] Empty state is calm and customer-facing
- [ ] Error state has retry
- [ ] Status labels are human
- [ ] View offer opens detail
- [ ] No raw backend statuses appear

## Offer Detail

- [ ] Claimable offer shows Claim opening CTA
- [ ] Expired offer disables CTA
- [ ] Claimed offer shows Claim submitted / status state
- [ ] Confirmed offer shows Booking confirmed
- [ ] Sticky action bar does not cover content
- [ ] What happens next copy is clear
- [ ] Claim success updates UI
- [ ] Claim error is visible and recoverable

## Activity

- [ ] Rows are grouped by Today / Yesterday / Earlier
- [ ] Rows use human labels
- [ ] Rows with offer/claim context route correctly
- [ ] Empty state is calm
- [ ] Error state has retry
- [ ] No raw backend event names appear

## Profile

- [ ] Account section is readable
- [ ] Notification permission state is clear
- [ ] Push debug block is DEBUG-only
- [ ] Standby preferences are understandable
- [ ] Sign out works
- [ ] Sign out deactivates current APNs token when available

## Accessibility / Device

- [ ] Dynamic Type does not break landing
- [ ] Dynamic Type does not break offer cards
- [ ] Reduce Motion works
- [ ] VoiceOver labels are reasonable for buttons/statuses
- [ ] iPhone SE/small device layout does not clip
- [ ] iPhone Pro Max layout does not feel sparse
- [ ] Tab bar does not cover content
- [ ] Pull-to-refresh works where expected
