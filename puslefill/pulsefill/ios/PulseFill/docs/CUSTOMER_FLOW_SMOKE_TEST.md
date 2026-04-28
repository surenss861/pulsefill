# Customer flow smoke test

Use this to prove the end-to-end operator and customer path with real data.

## Invite → standby → offer smoke

- [ ] Apply `0018_customer_invites.sql`
- [ ] Apply `0019_customer_invites_accepted_by.sql`
- [ ] Operator creates invite from /customers
- [ ] Customer signs in with the invited email
- [ ] Customer accepts invite token
- [ ] Invite status changes to accepted
- [ ] customers row exists for the business/customer
- [ ] App shows standby setup needed
- [ ] Customer completes standby preferences
- [ ] Operator sends offers for a matching open slot
- [ ] slot_offers row is created
- [ ] Customer sees offer
- [ ] Customer claims offer
- [ ] Operator confirms booking
- [ ] Overview checklist reaches 6/6

## How to run the loop (manually)

1. **Migrations** — In Supabase SQL Editor (or your migration tool), run `0018` then `0019` in order. From the repo root, if you have `psql` and a `DATABASE_URL` (Supabase **Project Settings → Database** connection string, usually with `sslmode=require`), you can run `./scripts/apply-customer-invite-migrations.sh`.

   **Verify columns** (SQL Editor is fine):

   ```sql
   select column_name
   from information_schema.columns
   where table_schema = 'public' and table_name = 'customer_invites'
   order by ordinal_position;
   ```

   You should see `accepted_by_customer_id` after `0019`.
2. **Operator (dashboard web)** — Create location, provider, service, and an open slot. On `/customers`, create a customer invite and copy the one-time token or `invite_url` (API must have `CUSTOMER_APP_BASE_URL` set for a full https URL; otherwise copy the token).
3. **Customer (iOS)** — Sign up or sign in with **the same email** as the invite. Accept via Profile → Business invite, or open `pulsefill://invite?token=<PASTE_TOKEN>`.
4. **Verify** — Invite shows `accepted` in the operator list, API returns `needs_standby_setup: true` until preferences exist, then complete standby in the app.
5. **Offers** — On web, open the open slot, **Send offers**. Confirm a `slot_offers` row (and that overview advances as expected for your product metrics).
6. **Claim & confirm** — Customer sees the offer, claims, operator confirms booking, overview at 6/6 for your setup checklist if that is how the product counts completion.

**Email rule:** the signed-in user’s email must match the invited address. The API returns a plain-language message; the iOS app shows that message, not a raw error code. If the wrong account is used, sign out and use the invited email, or ask the operator for a new invite.

**Deep link:** the app registers the `pulsefill` URL scheme for `pulsefill://invite?token=...`.
