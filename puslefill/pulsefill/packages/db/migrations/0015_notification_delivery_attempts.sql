create table if not exists public.notification_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  open_slot_id uuid references public.open_slots (id) on delete set null,
  claim_id uuid references public.slot_claims (id) on delete set null,
  type text not null,
  channel text not null check (channel in ('push', 'sms', 'email')),
  decision text not null check (decision in ('send', 'suppress')),
  status text not null check (status in ('queued', 'suppressed', 'sent', 'failed')),
  dedupe_key text not null,
  suppression_reason text,
  retryable boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  provider text,
  provider_message_id text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_delivery_attempts_business_created_idx
  on public.notification_delivery_attempts (business_id, created_at desc);

create unique index if not exists notification_delivery_attempts_dedupe_key_idx
  on public.notification_delivery_attempts (dedupe_key);

create or replace function public.set_notification_delivery_attempts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_delivery_attempts_set_updated_at on public.notification_delivery_attempts;

create trigger notification_delivery_attempts_set_updated_at
before update on public.notification_delivery_attempts
for each row
execute function public.set_notification_delivery_attempts_updated_at();
