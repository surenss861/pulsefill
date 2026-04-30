-- Atomic staff send-offers mutations.
-- External queueing/push delivery still happens after commit; this function keeps
-- offer upserts, slot state, initial notification logs, audit, and last-touch
-- updates in one database transaction.

create or replace function public.staff_send_open_slot_offers(
  p_open_slot_id uuid,
  p_business_id uuid,
  p_staff_id uuid,
  p_staff_auth_user_id uuid,
  p_offer_rows jsonb,
  p_queue_enabled boolean,
  p_match_summary jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.open_slots%rowtype;
  v_offer record;
  v_offer_ids jsonb := '[]'::jsonb;
  v_offer_customer_ids jsonb := '[]'::jsonb;
  v_count integer := 0;
begin
  if jsonb_typeof(p_offer_rows) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'error', 'invalid_offer_rows');
  end if;

  select * into v_slot from public.open_slots where id = p_open_slot_id for update;
  if not found or v_slot.business_id <> p_business_id then
    return jsonb_build_object('ok', false, 'error', 'slot_not_found');
  end if;

  if not exists (
    select 1
    from public.staff_users s
    where s.id = p_staff_id
      and s.business_id = p_business_id
      and s.auth_user_id = p_staff_auth_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_slot.status not in ('open'::public.open_slot_status, 'offered'::public.open_slot_status) then
    return jsonb_build_object(
      'ok', false,
      'error', 'slot_not_sendable',
      'status', v_slot.status
    );
  end if;

  if v_slot.status = 'offered'::public.open_slot_status and exists (
    select 1
    from public.slot_offers so
    where so.open_slot_id = p_open_slot_id
      and so.status in (
        'sent'::public.slot_offer_status,
        'delivered'::public.slot_offer_status,
        'viewed'::public.slot_offer_status
      )
      and so.expires_at > now()
  ) then
    return jsonb_build_object('ok', false, 'error', 'offers_in_flight');
  end if;

  for v_offer in
    with parsed as (
      select
        (value->>'customer_id')::uuid as customer_id,
        coalesce(nullif(value->>'channel', ''), 'push')::public.notification_channel as channel,
        (value->>'expires_at')::timestamptz as expires_at
      from jsonb_array_elements(p_offer_rows) as value
    ),
    deduped as (
      select distinct on (customer_id) customer_id, channel, expires_at
      from parsed
      where customer_id is not null
        and expires_at is not null
      order by customer_id
    )
    insert into public.slot_offers (
      open_slot_id,
      customer_id,
      channel,
      expires_at,
      status
    )
    select
      p_open_slot_id,
      d.customer_id,
      d.channel,
      d.expires_at,
      'sent'::public.slot_offer_status
    from deduped d
    on conflict (open_slot_id, customer_id)
    do update set
      channel = excluded.channel,
      expires_at = excluded.expires_at,
      status = 'sent'::public.slot_offer_status,
      sent_at = now()
    returning id, customer_id, channel
  loop
    v_count := v_count + 1;
    v_offer_ids := v_offer_ids || jsonb_build_array(v_offer.id);
    v_offer_customer_ids := v_offer_customer_ids || jsonb_build_array(
      jsonb_build_object(
        'offer_id', v_offer.id,
        'customer_id', v_offer.customer_id,
        'channel', v_offer.channel
      )
    );

    insert into public.notification_logs (
      open_slot_id,
      slot_offer_id,
      customer_id,
      channel,
      status,
      error,
      metadata
    )
    values (
      p_open_slot_id,
      v_offer.id,
      v_offer.customer_id,
      v_offer.channel,
      'pending_queue',
      null,
      '{}'::jsonb
    );
  end loop;

  update public.open_slots
    set
      status = 'offered'::public.open_slot_status,
      last_offer_batch_at = now(),
      last_touched_by_staff_id = p_staff_id,
      last_touched_at = now()
  where id = p_open_slot_id;

  insert into public.audit_events (
    business_id,
    actor_type,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_business_id,
    'staff'::public.actor_type,
    p_staff_id,
    'offers_sent',
    'open_slot',
    p_open_slot_id,
    jsonb_build_object(
      'count', v_count,
      'queued', p_queue_enabled,
      'queue_status', 'pending',
      'match_summary', coalesce(p_match_summary, '{}'::jsonb),
      'staff_auth_user_id', p_staff_auth_user_id
    )
  );

  return jsonb_build_object(
    'ok', true,
    'offer_ids', v_offer_ids,
    'offer_customer_ids', v_offer_customer_ids
  );
end;
$$;

create or replace function public.staff_record_open_slot_no_matches(
  p_open_slot_id uuid,
  p_business_id uuid,
  p_staff_id uuid,
  p_staff_auth_user_id uuid,
  p_no_matches_reason text,
  p_match_summary jsonb,
  p_match_diagnostics jsonb
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
  if not found or v_slot.business_id <> p_business_id then
    return jsonb_build_object('ok', false, 'error', 'slot_not_found');
  end if;

  if not exists (
    select 1
    from public.staff_users s
    where s.id = p_staff_id
      and s.business_id = p_business_id
      and s.auth_user_id = p_staff_auth_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_slot.status not in ('open'::public.open_slot_status, 'offered'::public.open_slot_status) then
    return jsonb_build_object(
      'ok', false,
      'error', 'slot_not_sendable',
      'status', v_slot.status
    );
  end if;

  insert into public.audit_events (
    business_id,
    actor_type,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_business_id,
    'staff'::public.actor_type,
    p_staff_id,
    'offers_no_match',
    'open_slot',
    p_open_slot_id,
    jsonb_build_object(
      'matched', 0,
      'no_matches_reason', p_no_matches_reason,
      'match_summary', coalesce(p_match_summary, '{}'::jsonb),
      'match_diagnostics', coalesce(p_match_diagnostics, '[]'::jsonb),
      'staff_auth_user_id', p_staff_auth_user_id
    )
  );

  update public.open_slots
    set
      last_touched_by_staff_id = p_staff_id,
      last_touched_at = now()
  where id = p_open_slot_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.staff_send_open_slot_offers(uuid, uuid, uuid, uuid, jsonb, boolean, jsonb) from public;
grant execute on function public.staff_send_open_slot_offers(uuid, uuid, uuid, uuid, jsonb, boolean, jsonb) to service_role;

revoke all on function public.staff_record_open_slot_no_matches(uuid, uuid, uuid, uuid, text, jsonb, jsonb) from public;
grant execute on function public.staff_record_open_slot_no_matches(uuid, uuid, uuid, uuid, text, jsonb, jsonb) to service_role;
