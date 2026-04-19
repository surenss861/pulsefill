create table if not exists public.customer_push_devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  platform text not null check (platform in ('ios')),
  device_token text not null,
  app_build text,
  environment text not null default 'development' check (environment in ('development', 'production')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, device_token)
);

create index if not exists customer_push_devices_customer_id_idx
  on public.customer_push_devices (customer_id)
  where (active = true);

alter table public.customer_push_devices enable row level security;
