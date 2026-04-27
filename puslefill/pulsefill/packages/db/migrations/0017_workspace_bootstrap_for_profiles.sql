-- Auto-create a business + staff_users (owner) when a profile is created, so new
-- operator signups are not stuck with profiles.role = 'operator' but no API staff row.
-- Idempotent: skips if this user already has any staff_users row.

create or replace function public.bootstrap_staff_workspace_for_user(
  p_user_id uuid,
  p_email text,
  p_full_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_slug text;
  v_name text;
  v_local_name text;
begin
  if exists (select 1 from public.staff_users where auth_user_id = p_user_id) then
    return;
  end if;

  v_slug := 'wf-' || replace(gen_random_uuid()::text, '-', '');
  v_local_name := coalesce(
    nullif(trim(p_full_name), ''),
    nullif(trim(split_part(coalesce(p_email, ''), '@', 1)), ''),
    'My'
  );
  v_name := v_local_name || ' workspace';

  insert into public.businesses (name, slug, timezone, email)
  values (v_name, v_slug, 'America/New_York', nullif(trim(p_email), ''))
  returning id into v_business_id;

  insert into public.staff_users (business_id, auth_user_id, role, full_name, email)
  values (
    v_business_id,
    p_user_id,
    'owner',
    nullif(trim(p_full_name), ''),
    nullif(trim(p_email), '')
  );
end;
$$;

comment on function public.bootstrap_staff_workspace_for_user(uuid, text, text) is
  'Creates businesses + staff_users owner row for a new profile if none exists; used by trigger and one-time backfill.';

revoke all on function public.bootstrap_staff_workspace_for_user(uuid, text, text) from public;

create or replace function public.bootstrap_operator_workspace_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bootstrap_staff_workspace_for_user(new.id, new.email, coalesce(new.full_name, ''));
  return new;
end;
$$;

drop trigger if exists profiles_bootstrap_staff_workspace on public.profiles;

create trigger profiles_bootstrap_staff_workspace
after insert on public.profiles
for each row
execute function public.bootstrap_operator_workspace_from_profile();

-- One-time: existing profiles (e.g. created before this migration) with no staff row.
do $$
declare
  r record;
begin
  for r in
    select p.id, p.email, p.full_name
    from public.profiles p
    where not exists (select 1 from public.staff_users s where s.auth_user_id = p.id)
  loop
    perform public.bootstrap_staff_workspace_for_user(r.id, r.email, coalesce(r.full_name, ''));
  end loop;
end $$;
