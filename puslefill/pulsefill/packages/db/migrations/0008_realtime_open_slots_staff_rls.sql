-- PulseFill: Supabase Realtime + browser-authenticated staff RLS for dashboard Realtime.
-- Apply after 0001–0007. Safe to re-run: publication add is conditional; policies use DROP IF EXISTS.

-- ---------------------------------------------------------------------------
-- A) Realtime: replicate open_slots so postgres_changes can fire for subscribed clients.
-- Requires Supabase publication `supabase_realtime` (present in hosted Supabase).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'open_slots'
    ) then
      execute 'alter publication supabase_realtime add table public.open_slots';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- B) Staff can read their own staff_users row (needed for open_slots policy checks).
-- ---------------------------------------------------------------------------
drop policy if exists "staff read own staff_users row" on public.staff_users;
create policy "staff read own staff_users row"
  on public.staff_users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- C) Staff can read open_slots for their business (dashboard Realtime visibility).
-- ---------------------------------------------------------------------------
drop policy if exists "staff can read own business open_slots" on public.open_slots;
create policy "staff can read own business open_slots"
  on public.open_slots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.staff_users su
      where su.auth_user_id = auth.uid()
        and su.business_id = open_slots.business_id
    )
  );

-- ---------------------------------------------------------------------------
-- D) Optional: read slot_offers / slot_claims for same business (future browser reads).
-- ---------------------------------------------------------------------------
drop policy if exists "staff can read slot_offers for own business" on public.slot_offers;
create policy "staff can read slot_offers for own business"
  on public.slot_offers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.open_slots os
      join public.staff_users su on su.business_id = os.business_id
      where su.auth_user_id = auth.uid()
        and os.id = slot_offers.open_slot_id
    )
  );

drop policy if exists "staff can read slot_claims for own business" on public.slot_claims;
create policy "staff can read slot_claims for own business"
  on public.slot_claims
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.open_slots os
      join public.staff_users su on su.business_id = os.business_id
      where su.auth_user_id = auth.uid()
        and os.id = slot_claims.open_slot_id
    )
  );
