-- Phased marketplace foundation: business standby access mode, memberships, customer requests.
-- API uses service role; RLS enabled for defense in depth.

create type public.standby_access_mode as enum ('private', 'request_to_join', 'public');

alter table public.businesses
  add column if not exists standby_access_mode public.standby_access_mode not null default 'private',
  add column if not exists customer_discovery_enabled boolean not null default false;

comment on column public.businesses.standby_access_mode is
  'How customers may join standby: private (invite only), request_to_join, or public.';
comment on column public.businesses.customer_discovery_enabled is
  'When true, business may appear in customer directory APIs (Phase 2+).';

create table public.customer_business_memberships (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  source text not null default 'invite' check (source in ('invite', 'request', 'public')),
  created_at timestamptz not null default now(),
  unique (customer_id, business_id)
);

create index customer_business_memberships_business_id_idx
  on public.customer_business_memberships (business_id);

create index customer_business_memberships_customer_id_idx
  on public.customer_business_memberships (customer_id);

comment on table public.customer_business_memberships is
  'Active link between a customer profile and a business for standby/offers.';

create type public.customer_standby_request_status as enum ('pending', 'approved', 'declined', 'cancelled');

create table public.customer_standby_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  status public.customer_standby_request_status not null default 'pending',
  message text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_staff_id uuid references public.staff_users (id) on delete set null
);

create unique index customer_standby_requests_one_pending_per_pair
  on public.customer_standby_requests (business_id, customer_id)
  where (status = 'pending');

create index customer_standby_requests_business_status_idx
  on public.customer_standby_requests (business_id, status);

comment on table public.customer_standby_requests is
  'Customer-initiated standby access requests (Phase 2); staff approve/decline.';

alter table public.customer_business_memberships enable row level security;
alter table public.customer_standby_requests enable row level security;
