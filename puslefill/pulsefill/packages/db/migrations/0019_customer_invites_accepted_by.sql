-- Track which customer accepted (idempotency + audit).

alter table public.customer_invites
  add column if not exists accepted_by_customer_id uuid references public.customers (id) on delete set null;

create index if not exists customer_invites_accepted_by_customer_id_idx
  on public.customer_invites (accepted_by_customer_id)
  where (accepted_by_customer_id is not null);

comment on column public.customer_invites.accepted_by_customer_id is
  'Set when status becomes accepted; used to verify repeat accept with same token.';
