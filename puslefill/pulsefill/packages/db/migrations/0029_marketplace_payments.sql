-- Marketplace payments (Stripe Connect Express, destination charges, manual
-- capture, 10% platform application fee). Additive: free-slot flow (no
-- price_cents / payment_required) is untouched; existing claim/confirm RPC
-- signatures gain new optional params rather than being replaced.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.business_connect_status as enum (
  'not_started',
  'pending',
  'enabled',
  'restricted',
  'disabled'
);

create type public.slot_payment_status as enum (
  'requires_payment',
  'authorized',
  'capturing',
  'captured',
  'canceled',
  'refunded',
  'failed'
);

-- ---------------------------------------------------------------------------
-- Business Stripe Connect (Express) account state
-- ---------------------------------------------------------------------------

create table public.business_connect_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  stripe_account_id text not null unique,
  status public.business_connect_status not null default 'not_started',
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  disabled_reason text,
  requirements_currently_due jsonb not null default '[]',
  onboarding_link_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_connect_accounts_stripe_account_id_idx
  on public.business_connect_accounts (stripe_account_id);

alter table public.business_connect_accounts enable row level security;

-- ---------------------------------------------------------------------------
-- Paid open slots
-- ---------------------------------------------------------------------------

alter table public.open_slots
  add column price_cents integer,
  add column currency text not null default 'usd',
  add column payment_required boolean not null default false;

alter table public.open_slots
  add constraint open_slots_price_chk
  check (not payment_required or (price_cents is not null and price_cents > 0));

-- ---------------------------------------------------------------------------
-- Per-claim payment state
-- ---------------------------------------------------------------------------

create table public.slot_claim_payments (
  id uuid primary key default gen_random_uuid(),
  open_slot_id uuid not null references public.open_slots (id) on delete cascade,
  claim_id uuid references public.slot_claims (id) on delete set null,
  customer_id uuid not null references public.customers (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  stripe_connect_account_id text not null,
  amount_cents integer not null,
  application_fee_cents integer not null,
  currency text not null default 'usd',
  status public.slot_payment_status not null default 'requires_payment',
  authorized_at timestamptz,
  captured_at timestamptz,
  canceled_at timestamptz,
  refunded_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index slot_claim_payments_open_slot_id_idx on public.slot_claim_payments (open_slot_id);
create index slot_claim_payments_claim_id_idx on public.slot_claim_payments (claim_id);
create index slot_claim_payments_customer_id_idx on public.slot_claim_payments (customer_id);
create index slot_claim_payments_business_id_idx on public.slot_claim_payments (business_id);

-- At most one active (not yet resolved) payment per slot, mirroring
-- slot_claims_one_winner_per_slot's role as the DB-level race backstop.
create unique index slot_claim_payments_one_active_per_slot
  on public.slot_claim_payments (open_slot_id)
  where (status in ('authorized', 'capturing', 'captured'));

alter table public.slot_claim_payments enable row level security;

-- ---------------------------------------------------------------------------
-- Stripe webhook idempotency (benefits the existing SaaS billing webhook too)
-- ---------------------------------------------------------------------------

create table public.processed_stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.processed_stripe_events enable row level security;

-- ---------------------------------------------------------------------------
-- claim_open_slot: gate on an authorized payment when the slot requires one.
-- New param is additive (default null) so the free-slot call shape is unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.claim_open_slot(
  p_open_slot_id uuid,
  p_customer_id uuid,
  p_deposit_payment_intent_id text default null,
  p_stripe_payment_intent_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.open_slots%rowtype;
  v_claim_id uuid;
  v_payment public.slot_claim_payments%rowtype;
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

  if v_slot.payment_required then
    if p_stripe_payment_intent_id is null then
      return jsonb_build_object('ok', false, 'error', 'payment_required');
    end if;

    select *
      into v_payment
    from public.slot_claim_payments
    where open_slot_id = p_open_slot_id
      and customer_id = p_customer_id
      and stripe_payment_intent_id = p_stripe_payment_intent_id
      and status = 'authorized'
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'payment_not_authorized');
    end if;
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

  if v_payment.id is not null then
    update public.slot_claim_payments
      set claim_id = v_claim_id,
          updated_at = now()
      where id = v_payment.id;
  end if;

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

revoke all on function public.claim_open_slot(uuid, uuid, text, text) from public;
grant execute on function public.claim_open_slot(uuid, uuid, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Two-phase confirm: free slots resolve in one call exactly like before.
-- Paid slots pause after locking so the API can capture via Stripe, then
-- finalize with the real outcome — the slot only becomes `booked` once
-- capture has actually succeeded.
-- ---------------------------------------------------------------------------

create or replace function public.confirm_open_slot_claim_start_capture(
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
  v_payment public.slot_claim_payments%rowtype;
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

  select *
    into v_payment
  from public.slot_claim_payments
  where claim_id = p_claim_id
    and status = 'authorized'
  for update;

  if not found then
    -- Free slot (or no payment row at all): resolve immediately, same as the
    -- original single-phase confirm_open_slot_claim.
    update public.slot_claims
      set status = 'confirmed',
          confirmed_at = now()
    where id = p_claim_id;

    update public.open_slots
      set status = 'booked'
    where id = p_open_slot_id;

    return jsonb_build_object('ok', true, 'requires_capture', false);
  end if;

  update public.slot_claim_payments
    set status = 'capturing',
        updated_at = now()
  where id = v_payment.id;

  return jsonb_build_object(
    'ok', true,
    'requires_capture', true,
    'payment_id', v_payment.id,
    'payment_intent_id', v_payment.stripe_payment_intent_id,
    'stripe_connect_account_id', v_payment.stripe_connect_account_id,
    'amount_cents', v_payment.amount_cents,
    'application_fee_cents', v_payment.application_fee_cents
  );
end;
$$;

revoke all on function public.confirm_open_slot_claim_start_capture(uuid, uuid, uuid) from public;
grant execute on function public.confirm_open_slot_claim_start_capture(uuid, uuid, uuid) to service_role;

create or replace function public.confirm_open_slot_claim_finalize(
  p_open_slot_id uuid,
  p_claim_id uuid,
  p_capture_ok boolean,
  p_failure_reason text default null,
  p_terminal boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.slot_claim_payments%rowtype;
begin
  select *
    into v_payment
  from public.slot_claim_payments
  where claim_id = p_claim_id
    and status = 'capturing'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment_not_found');
  end if;

  if p_capture_ok then
    update public.slot_claim_payments
      set status = 'captured',
          captured_at = now(),
          updated_at = now()
      where id = v_payment.id;

    update public.slot_claims
      set status = 'confirmed',
          confirmed_at = now()
    where id = p_claim_id;

    update public.open_slots
      set status = 'booked'
    where id = p_open_slot_id;

    return jsonb_build_object('ok', true, 'status', 'captured');
  end if;

  update public.slot_claim_payments
    set status = (case when p_terminal then 'failed' else 'authorized' end)::public.slot_payment_status,
        failure_reason = p_failure_reason,
        updated_at = now()
    where id = v_payment.id;

  -- Slot/claim stay claimed/won so staff can retry confirm, or the stale-
  -- authorization sweep will eventually release it if it's left too long.
  return jsonb_build_object('ok', true, 'status', case when p_terminal then 'failed' else 'authorized' end);
end;
$$;

revoke all on function public.confirm_open_slot_claim_finalize(uuid, uuid, boolean, text, boolean) from public;
grant execute on function public.confirm_open_slot_claim_finalize(uuid, uuid, boolean, text, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- Cancel/expire release for stale authorizations (worker sweep) and staff
-- cancel of a not-yet-captured paid claim.
-- ---------------------------------------------------------------------------

create or replace function public.cancel_slot_claim_payment_and_release(
  p_payment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.slot_claim_payments%rowtype;
begin
  select * into v_payment from public.slot_claim_payments where id = p_payment_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment_not_found');
  end if;

  if v_payment.status <> 'authorized' then
    return jsonb_build_object('ok', false, 'error', 'payment_not_authorized', 'status', v_payment.status);
  end if;

  update public.slot_claim_payments
    set status = 'canceled',
        canceled_at = now(),
        updated_at = now()
  where id = p_payment_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.cancel_slot_claim_payment_and_release(uuid) from public;
grant execute on function public.cancel_slot_claim_payment_and_release(uuid) to service_role;

create or replace function public.refund_slot_claim_payment(
  p_claim_id uuid,
  p_staff_auth_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.slot_claim_payments%rowtype;
  v_staff public.staff_users%rowtype;
begin
  select *
    into v_payment
  from public.slot_claim_payments
  where claim_id = p_claim_id
    and status = 'captured'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment_not_found');
  end if;

  select *
    into v_staff
  from public.staff_users
  where business_id = v_payment.business_id
    and auth_user_id = p_staff_auth_user_id
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  update public.slot_claim_payments
    set status = 'refunded',
        refunded_at = now(),
        updated_at = now()
  where id = v_payment.id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment.id,
    'payment_intent_id', v_payment.stripe_payment_intent_id,
    'stripe_connect_account_id', v_payment.stripe_connect_account_id
  );
end;
$$;

revoke all on function public.refund_slot_claim_payment(uuid, uuid) from public;
grant execute on function public.refund_slot_claim_payment(uuid, uuid) to service_role;
