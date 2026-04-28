-- Operator-issued customer invites (magic link); acceptance handled by customer app (separate flow).

create type public.customer_invite_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table public.customer_invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  token_hash text not null,
  status public.customer_invite_status not null default 'pending',
  expires_at timestamptz not null,
  created_by_staff_id uuid not null references public.staff_users (id) on delete restrict,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index customer_invites_business_id_idx on public.customer_invites (business_id);
create unique index customer_invites_token_hash_uidx on public.customer_invites (token_hash);

-- At most one pending invite per (business, normalized email).
create unique index customer_invites_one_pending_per_business_email
  on public.customer_invites (business_id, (lower(btrim(email::text))))
  where (status = 'pending');

alter table public.customer_invites enable row level security;

comment on table public.customer_invites is
  'Staff-scoped customer joins; store SHA-256 of one-time token only. API service role bypasses RLS.';
