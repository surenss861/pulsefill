# iOS Offer Inbox & Detail QA

Run against a **deployed API** after marketplace offer eligibility is live (`0020` + matcher). Exercise three customer sources:

- **Public join** — customer joined a discoverable public business from Find.
- **Request-approved** — customer requested access and was approved.
- **Invite** — customer joined via invite (regression).

Goal: **see offer → open detail → claim (when allowed) → waiting → confirmed**, with **patient-safe copy** (opening, claim, confirmation; no raw backend terms like `slot_offer`, `lost`, `operator`).

---

## Available offers (Inbox)

- [ ] Offers the customer can still claim appear under **Available**.
- [ ] Card shows business name, service, time, and claim-by / expiry context where applicable.
- [ ] Chrome action reads **View opening** (or equivalent).
- [ ] Small label reads **Opening available** (or equivalent) for claimable rows.
- [ ] Tapping the card opens **Offer detail**.

---

## Waiting for confirmation (Inbox)

- [ ] After claim, the offer moves out of **Available** into **Waiting** (not mixed with claimable rows).
- [ ] Section label is **Waiting** (or clearly “waiting for confirmation” in copy).
- [ ] Card label reflects **Waiting for confirmation** (or equivalent).
- [ ] Chrome action reads **View status**.
- [ ] No duplicate “claim” affordance on the inbox row itself.
- [ ] Pull to refresh keeps the offer in **Waiting** until the business confirms or the offer ends.

---

## History (Inbox)

- [ ] Confirmed, expired, unavailable, and other terminal states appear under **History** (not under Available or Waiting).
- [ ] Past-style cards still open detail for reference where supported.
- [ ] Ordering feels sensible (e.g. recent first).

---

## Empty & signed-out copy

- [ ] Signed-out / empty states refer to **businesses you connect with** or **joined**, not “your clinic” or invite-only language.
- [ ] Empty state explains that openings appear when they **match standby preferences** (marketplace-appropriate).

---

## Offer detail

### Layout & trust

- [ ] Navigation title uses customer language (e.g. **Opening**).
- [ ] Sections include: status context, business + service, time + location, **why you received this**, **what happens next**, and primary action when relevant.
- [ ] No raw IDs, internal enums, or operator/dashboard jargon in visible UI.

### Status banner (by state)

- [ ] **Claimable** — explains that the customer can claim if the time still works.
- [ ] **Waiting for confirmation** — claim was sent; business will confirm.
- [ ] **Confirmed** — customer is booked; no misleading “you already booked” without confirmation.
- [ ] **Expired / unavailable** — **No longer available** (or equivalent); calm copy.
- [ ] **Taken** (lost / not won) — customer-safe wording (e.g. **This opening was taken**); the word **lost** does not appear in UI copy.

### Why you received this

- [ ] Explains **standby preferences** for this business (not invite-only framing).
- [ ] If API provides matched preference summary, it is shown in plain language.

---

## Claim flow

- [ ] Primary button shows **Claim opening** when claim is allowed; **Claiming…** (or disabled) while the request is in flight.
- [ ] Double-tap / repeat submit does not send duplicate claims.
- [ ] On failure, user sees a clear message without crashing; pull to refresh still works.
- [ ] On success, user sees **claim sent** / waiting copy; detail reload reflects **Waiting**.
- [ ] After success, **no second claim** when status is pending confirmation.

---

## Marketplace customer paths

### Public join

- [ ] Customer who joined a public business sees correct **business** and **service** on inbox and detail.
- [ ] Offer appears under **Available** until claimed.

### Request-approved

- [ ] Same as public for inbox/detail after approval.

### Invite (regression)

- [ ] Invite customer still sees offers in **Available** when claimable.
- [ ] Claim → wait → confirm path unchanged from pre-marketplace behavior.

---

## Regression / language audit

Scan visible strings on **Offers** tab and **Opening** detail for:

- [ ] Prefer **opening**, **claim**, **confirmed**, **waiting for confirmation**, **business**, **standby preferences**.
- [ ] Avoid **slot**, **operator**, **dashboard**, **revenue**, **claim won/lost**, **slot_offer**, raw API field names in customer copy.

---

## Suggested run order

1. Apply DB migrations if needed; deploy API.
2. Run **backend** eligibility QA: `docs/MARKETPLACE_OFFER_ELIGIBILITY_QA.md`.
3. Build iOS against deployed API; run the checklists above for **public**, **request**, and **invite** customers.
