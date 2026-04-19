-- PulseFill core schema (Supabase Postgres)
-- Apply with Supabase CLI or SQL editor. Uses gen_random_uuid().

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.staff_role as enum ('owner', 'admin', 'staff');

create type public.open_slot_status as enum (
  'open',
  'offered',
  'claimed',
  'booked',
  'expired',
  'cancelled'
);

create type public.slot_offer_status as enum (
  'sent',
  'delivered',
  'viewed',
  'claimed',
  'expired',
  'failed',
  'cancelled'
);

create type public.slot_claim_status as enum (
  'pending',
  'won',
  'lost',
  'confirmed',
  'failed'
);

create type public.subscription_plan as enum ('starter', 'growth', 'multi_location');

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete'
);

create type public.deposit_payment_status as enum (
  'requires_payment_method',
  'processing',
  'succeeded',
  'canceled',
  'failed'
);

create type public.notification_channel as enum ('push', 'sms', 'email');

create type public.actor_type as enum ('staff', 'customer', 'system');

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,
  timezone text not null default 'America/New_York',
  phone text,
  email text,
  website text,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  address_line_1 text,
  city text,
  region text,
  postal_code text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create index locations_business_id_idx on public.locations (business_id);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  name text not null,
  provider_type text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index providers_business_id_idx on public.providers (business_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  duration_minutes integer not null default 60,
  price_cents integer,
  deposit_required boolean not null default false,
  deposit_cents integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index services_business_id_idx on public.services (business_id);

create table public.staff_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  auth_user_id uuid not null,
  role public.staff_role not null default 'staff',
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  unique (business_id, auth_user_id)
);

create index staff_users_auth_user_id_idx on public.staff_users (auth_user_id);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  full_name text,
  email text,
  phone text,
  push_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  email_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.standby_preferences (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete cascade,
  service_id uuid references public.services (id) on delete cascade,
  provider_id uuid references public.providers (id) on delete cascade,
  max_notice_hours integer,
  earliest_time time,
  latest_time time,
  days_of_week smallint[] not null default '{}',
  max_distance_km integer,
  deposit_ok boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index standby_preferences_customer_id_idx on public.standby_preferences (customer_id);
create index standby_preferences_business_id_idx on public.standby_preferences (business_id);

create table public.open_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  provider_id uuid references public.providers (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  provider_name_snapshot text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  estimated_value_cents integer,
  notes text,
  last_offer_batch_at timestamptz,
  status public.open_slot_status not null default 'open',
  created_by uuid references public.staff_users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint open_slots_time_chk check (ends_at > starts_at)
);

create index open_slots_business_id_idx on public.open_slots (business_id);
create index open_slots_status_idx on public.open_slots (status);
create index open_slots_starts_at_idx on public.open_slots (starts_at);

create table public.slot_offers (
  id uuid primary key default gen_random_uuid(),
  open_slot_id uuid not null references public.open_slots (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  channel public.notification_channel not null default 'push',
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status public.slot_offer_status not null default 'sent',
  unique (open_slot_id, customer_id)
);

create index slot_offers_open_slot_id_idx on public.slot_offers (open_slot_id);
create index slot_offers_customer_id_idx on public.slot_offers (customer_id);

create table public.slot_claims (
  id uuid primary key default gen_random_uuid(),
  open_slot_id uuid not null references public.open_slots (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  status public.slot_claim_status not null default 'pending',
  deposit_payment_intent_id text
);

create index slot_claims_open_slot_id_idx on public.slot_claims (open_slot_id);
create index slot_claims_customer_id_idx on public.slot_claims (customer_id);

-- At most one terminal winner per slot (covers won -> confirmed transition).
create unique index slot_claims_one_winner_per_slot
  on public.slot_claims (open_slot_id)
  where (status in ('won', 'confirmed'));

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan public.subscription_plan not null default 'starter',
  status public.subscription_status not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_business_id_idx on public.subscriptions (business_id);

create table public.deposit_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  open_slot_id uuid references public.open_slots (id) on delete set null,
  payment_intent_id text not null,
  amount_cents integer not null,
  status public.deposit_payment_status not null default 'processing',
  created_at timestamptz not null default now()
);

create index deposit_payments_open_slot_id_idx on public.deposit_payments (open_slot_id);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  actor_type public.actor_type not null,
  actor_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_events_business_id_idx on public.audit_events (business_id);
create index audit_events_created_at_idx on public.audit_events (created_at desc);

create table public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  metric_date date not null,
  open_slots_count integer not null default 0,
  offers_sent_count integer not null default 0,
  recovered_slots_count integer not null default 0,
  recovered_revenue_cents bigint not null default 0,
  unique (business_id, metric_date)
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  open_slot_id uuid references public.open_slots (id) on delete set null,
  slot_offer_id uuid references public.slot_offers (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  channel public.notification_channel not null,
  provider_message_id text,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);

create index notification_logs_slot_offer_id_idx on public.notification_logs (slot_offer_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- API is expected to use the Supabase service role key (bypasses RLS).
-- Enable RLS so accidental anon/authenticated PostgREST access is denied
-- until you add explicit policies for client-side reads/writes.
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.locations enable row level security;
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.staff_users enable row level security;
alter table public.customers enable row level security;
alter table public.standby_preferences enable row level security;
alter table public.open_slots enable row level security;
alter table public.slot_offers enable row level security;
alter table public.slot_claims enable row level security;
alter table public.subscriptions enable row level security;
alter table public.deposit_payments enable row level security;
alter table public.audit_events enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.notification_logs enable row level security;
