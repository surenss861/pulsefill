alter table public.customer_push_devices
  add column if not exists token_type text not null default 'apns'
    check (token_type in ('apns', 'expo'));

alter table public.customer_push_devices
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists customer_push_devices_customer_platform_type_active_idx
  on public.customer_push_devices (customer_id, platform, token_type)
  where (active = true);

create index if not exists customer_push_devices_last_seen_idx
  on public.customer_push_devices (last_seen_at desc);
