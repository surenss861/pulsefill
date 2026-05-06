-- Staff-only internal notes per customer (workspace-scoped). API uses service role; RLS enabled for defense in depth.

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  body text not null,
  created_by_staff_id uuid references public.staff_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz,
  constraint customer_notes_body_nonempty_chk check (char_length(btrim(body)) >= 1),
  constraint customer_notes_body_max_chk check (char_length(body) <= 2000)
);

create index customer_notes_business_customer_created_idx
  on public.customer_notes (business_id, customer_id, created_at desc);

create index customer_notes_business_deleted_idx
  on public.customer_notes (business_id, deleted_at);

comment on table public.customer_notes is
  'Operator workspace notes about a customer; never exposed to customer APIs.';

alter table public.customer_notes enable row level security;
