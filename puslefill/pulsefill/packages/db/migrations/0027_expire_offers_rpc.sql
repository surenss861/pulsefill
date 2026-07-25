-- Atomic per-slot offer expiry: lock the open_slots row (same lock ordering
-- as claim_open_slot) before touching its offers, closing the race where the
-- previous worker implementation expired offers in a separate statement from
-- the slot-status decision.

create or replace function public.expire_stale_open_slot_offers_for_slot(
  p_open_slot_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.open_slots%rowtype;
  v_now timestamptz := now();
  v_expired_offers integer;
  v_next_status public.open_slot_status;
begin
  select *
    into v_slot
  from public.open_slots
  where id = p_open_slot_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'slot_not_found');
  end if;

  with expired as (
    update public.slot_offers
    set status = 'expired'
    where open_slot_id = p_open_slot_id
      and status = 'sent'
      and expires_at < v_now
    returning id
  )
  select count(*) into v_expired_offers from expired;

  if v_expired_offers = 0 then
    return jsonb_build_object('ok', true, 'expired_offers', 0, 'slot_status_changed', false);
  end if;

  -- Winning claim already exists: leave slot status untouched.
  if exists (
    select 1
    from public.slot_claims sc
    where sc.open_slot_id = p_open_slot_id
      and sc.status in ('won', 'confirmed')
  ) then
    return jsonb_build_object('ok', true, 'expired_offers', v_expired_offers, 'slot_status_changed', false);
  end if;

  -- Other live offers remain: leave slot status untouched.
  if exists (
    select 1
    from public.slot_offers so2
    where so2.open_slot_id = p_open_slot_id
      and so2.status in ('sent', 'delivered', 'viewed')
  ) then
    return jsonb_build_object('ok', true, 'expired_offers', v_expired_offers, 'slot_status_changed', false);
  end if;

  if v_slot.status not in ('open', 'offered', 'claimed') then
    return jsonb_build_object('ok', true, 'expired_offers', v_expired_offers, 'slot_status_changed', false);
  end if;

  v_next_status := case
    when v_slot.starts_at <= v_now then 'expired'::public.open_slot_status
    else 'open'::public.open_slot_status
  end;

  update public.open_slots
    set status = v_next_status
  where id = p_open_slot_id;

  insert into public.audit_events (
    business_id, actor_type, actor_id, event_type, entity_type, entity_id, metadata
  )
  values (
    v_slot.business_id,
    'system',
    null,
    case when v_next_status = 'expired' then 'slot_expired' else 'slot_reopened' end,
    'open_slot',
    p_open_slot_id,
    jsonb_build_object('reason', 'offer_expiry_sweep', 'expired_offer_count', v_expired_offers)
  );

  return jsonb_build_object(
    'ok', true,
    'expired_offers', v_expired_offers,
    'slot_status_changed', true,
    'next_status', v_next_status
  );
end;
$$;

revoke all on function public.expire_stale_open_slot_offers_for_slot(uuid) from public;
grant execute on function public.expire_stale_open_slot_offers_for_slot(uuid) to service_role;
