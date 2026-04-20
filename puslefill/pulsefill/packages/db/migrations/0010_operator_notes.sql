-- Operator internal notes + resolution status on open slots (staff-only via API).

alter table public.open_slots
  add column if not exists internal_note text,
  add column if not exists resolution_status text not null default 'none',
  add column if not exists internal_note_updated_at timestamptz;

alter table public.open_slots
  add constraint open_slots_resolution_status_chk
  check (resolution_status in (
    'none',
    'handled_manually',
    'no_retry_needed',
    'customer_contacted',
    'provider_unavailable',
    'ignore'
  ));

comment on column public.open_slots.internal_note is 'Staff-only context; not shown to customers.';
comment on column public.open_slots.resolution_status is 'Lightweight operator handling tag for scanning and handoff.';
comment on column public.open_slots.internal_note_updated_at is 'Last time internal note or resolution status was saved.';
