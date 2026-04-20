-- Row-level security for customer notification preferences.
-- API continues to use the service role (bypasses RLS). Authenticated customers
-- may only access the row keyed by their own customers.id.

alter table public.customer_notification_preferences enable row level security;

alter table public.customer_notification_preferences force row level security;

drop policy if exists "customer_notification_preferences_select_own" on public.customer_notification_preferences;
create policy "customer_notification_preferences_select_own"
  on public.customer_notification_preferences
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.customers c
      where c.id = customer_notification_preferences.customer_id
        and c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "customer_notification_preferences_insert_own" on public.customer_notification_preferences;
create policy "customer_notification_preferences_insert_own"
  on public.customer_notification_preferences
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.customers c
      where c.id = customer_notification_preferences.customer_id
        and c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "customer_notification_preferences_update_own" on public.customer_notification_preferences;
create policy "customer_notification_preferences_update_own"
  on public.customer_notification_preferences
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.customers c
      where c.id = customer_notification_preferences.customer_id
        and c.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.customers c
      where c.id = customer_notification_preferences.customer_id
        and c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "customer_notification_preferences_delete_own" on public.customer_notification_preferences;
create policy "customer_notification_preferences_delete_own"
  on public.customer_notification_preferences
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.customers c
      where c.id = customer_notification_preferences.customer_id
        and c.auth_user_id = auth.uid()
    )
  );
