-- Staff confirms the winning claim; slot becomes booked and claim confirmed.

create or replace function public.confirm_open_slot_claim(
  p_open_slot_id uuid,
  p_claim_id uuid,
  p_staff_auth_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.open_slots%rowtype;
  v_claim public.slot_claims%rowtype;
  v_staff public.staff_users%rowtype;
begin
  select * into v_slot from public.open_slots where id = p_open_slot_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'slot_not_found');
  end if;

  select *
    into v_staff
  from public.staff_users
  where business_id = v_slot.business_id
    and auth_user_id = p_staff_auth_user_id
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_slot.status <> 'claimed' then
    return jsonb_build_object(
      'ok', false,
      'error', 'slot_not_claimed',
      'status', v_slot.status
    );
  end if;

  select * into v_claim from public.slot_claims where id = p_claim_id for update;
  if not found or v_claim.open_slot_id <> p_open_slot_id then
    return jsonb_build_object('ok', false, 'error', 'claim_not_found');
  end if;

  if v_claim.status <> 'won' then
    return jsonb_build_object(
      'ok', false,
      'error', 'claim_not_won',
      'status', v_claim.status
    );
  end if;

  update public.slot_claims
    set status = 'confirmed'
  where id = p_claim_id;

  update public.open_slots
    set status = 'booked'
  where id = p_open_slot_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.confirm_open_slot_claim(uuid, uuid, uuid) from public;
grant execute on function public.confirm_open_slot_claim(uuid, uuid, uuid) to service_role;
