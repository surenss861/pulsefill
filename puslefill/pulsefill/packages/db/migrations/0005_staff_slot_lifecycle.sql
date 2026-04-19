-- Staff cancel / expire slot with authorization and row lock.

create or replace function public.staff_cancel_open_slot(
  p_open_slot_id uuid,
  p_staff_auth_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.open_slots%rowtype;
begin
  select * into v_slot from public.open_slots where id = p_open_slot_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'slot_not_found');
  end if;

  if not exists (
    select 1
    from public.staff_users s
    where s.business_id = v_slot.business_id
      and s.auth_user_id = p_staff_auth_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_slot.status not in ('open', 'offered') then
    return jsonb_build_object(
      'ok', false,
      'error', 'slot_not_cancellable',
      'status', v_slot.status
    );
  end if;

  update public.open_slots
    set status = 'cancelled'::public.open_slot_status
  where id = p_open_slot_id;

  update public.slot_offers
    set status = 'cancelled'::public.slot_offer_status
  where open_slot_id = p_open_slot_id
    and status in ('sent', 'delivered', 'viewed');

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.staff_expire_open_slot(
  p_open_slot_id uuid,
  p_staff_auth_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.open_slots%rowtype;
begin
  select * into v_slot from public.open_slots where id = p_open_slot_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'slot_not_found');
  end if;

  if not exists (
    select 1
    from public.staff_users s
    where s.business_id = v_slot.business_id
      and s.auth_user_id = p_staff_auth_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_slot.status not in ('open', 'offered') then
    return jsonb_build_object(
      'ok', false,
      'error', 'slot_not_expirable',
      'status', v_slot.status
    );
  end if;

  update public.open_slots
    set status = 'expired'::public.open_slot_status
  where id = p_open_slot_id;

  update public.slot_offers
    set status = 'expired'::public.slot_offer_status
  where open_slot_id = p_open_slot_id
    and status in ('sent', 'delivered', 'viewed');

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.staff_cancel_open_slot(uuid, uuid) from public;
grant execute on function public.staff_cancel_open_slot(uuid, uuid) to service_role;

revoke all on function public.staff_expire_open_slot(uuid, uuid) from public;
grant execute on function public.staff_expire_open_slot(uuid, uuid) to service_role;
