-- Customer-intent signups (auth.users.raw_user_meta_data.signup_intent = 'customer') should not
-- auto-provision an operator workspace (business + staff_users). Business signups keep default behavior.

create or replace function public.bootstrap_operator_workspace_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intent text;
begin
  select coalesce(raw_user_meta_data->>'signup_intent', '')
  into v_intent
  from auth.users
  where id = new.id;

  if lower(trim(v_intent)) = 'customer' then
    return new;
  end if;

  perform public.bootstrap_staff_workspace_for_user(new.id, new.email, coalesce(new.full_name, ''));
  return new;
end;
$$;
