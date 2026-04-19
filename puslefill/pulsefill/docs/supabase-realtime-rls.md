# Supabase Realtime + RLS (PulseFill dashboard)

The dashboard uses the **browser Supabase client** (anon key + staff session) for `postgres_changes` on `public.open_slots`. That path is subject to **RLS**, unlike the API (service role).

## Prerequisites

- Migrations through **`0008_realtime_open_slots_staff_rls.sql`** applied (adds publication + policies).
- Dashboard env: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` point to the **same** Supabase project as JWT verification / database.
- Staff user has a row in `staff_users` with **`auth_user_id` = that user’s Supabase Auth UUID**.

## Verify publication

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'open_slots';
```

Expect one row: `public | open_slots`.

If missing (and you use hosted Supabase):

```sql
alter publication supabase_realtime add table public.open_slots;
```

## Verify RLS policies

```sql
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('staff_users', 'open_slots', 'slot_offers', 'slot_claims')
order by tablename, policyname;
```

You should see **`staff can read own business open_slots`** on `SELECT` / `authenticated`.

## Verify `staff_users` mapping

```sql
select id, business_id, auth_user_id, email, role
from public.staff_users
order by created_at desc nulls last;
```

The signed-in dashboard user must appear with **`auth_user_id`** equal to `auth.uid()` when logged in as that user.

## Debug in the browser (optional)

Set in `apps/dashboard-web/.env.local`:

```bash
NEXT_PUBLIC_REALTIME_DEBUG=true
```

Reload the dashboard and open Claims or Slot detail. When `open_slots` updates, the console logs `[PulseFill realtime] ...` with the change payload. Turn off when done.

## Common failures

| Symptom | Likely cause |
|--------|----------------|
| No Realtime events | `open_slots` not in `supabase_realtime`, or wrong Supabase project in env |
| Events never arrive but REST API works | API uses service role; browser subject to RLS — fix policies / `staff_users.auth_user_id` |
| Login works, Realtime silent | Missing `staff_users` row or `auth_user_id` mismatch |

Polling (12–15s) remains the fallback if Realtime is misconfigured.
