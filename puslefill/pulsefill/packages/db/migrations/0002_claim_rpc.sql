-- Atomic claim: lock slot row, validate, insert winner, update related rows.
-- Intended to be called from the API using the Supabase service role after JWT
-- verification (map auth user -> customers.id and pass as p_customer_id).

create or replace function public.claim_open_slot(
  p_open_slot_id uuid,
  p_customer_id uuid,
  p_deposit_payment_intent_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.open_slots%rowtype;
  v_claim_id uuid;
begin
  select *
    into v_slot
  from public.open_slots
  where id = p_open_slot_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'slot_not_found');
  end if;

  if v_slot.status not in ('open', 'offered') then
    return jsonb_build_object(
      'ok', false,
      'error', 'slot_not_claimable',
      'status', v_slot.status
    );
  end if;

  if exists (
    select 1
    from public.slot_claims sc
    where sc.open_slot_id = p_open_slot_id
      and sc.status in ('won', 'confirmed')
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  if not exists (
    select 1
    from public.slot_offers so
    where so.open_slot_id = p_open_slot_id
      and so.customer_id = p_customer_id
      and so.status in ('sent', 'delivered', 'viewed')
      and so.expires_at > now()
  ) then
    return jsonb_build_object('ok', false, 'error', 'no_active_offer');
  end if;

  insert into public.slot_claims (
    open_slot_id,
    customer_id,
    status,
    deposit_payment_intent_id
  )
  values (
    p_open_slot_id,
    p_customer_id,
    'won',
    p_deposit_payment_intent_id
  )
  returning id into v_claim_id;

  update public.open_slots
    set status = 'claimed'
  where id = p_open_slot_id;

  update public.slot_offers
    set status = case
      when customer_id = p_customer_id then 'claimed'::public.slot_offer_status
      else 'cancelled'::public.slot_offer_status
    end
  where open_slot_id = p_open_slot_id
    and status in ('sent', 'delivered', 'viewed');

  return jsonb_build_object(
    'ok', true,
    'claim_id', v_claim_id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'lost_race');
end;
$$;

revoke all on function public.claim_open_slot(uuid, uuid, text) from public;
grant execute on function public.claim_open_slot(uuid, uuid, text) to service_role;
