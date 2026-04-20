-- Denormalized “who last touched this slot” for operator slot detail (API-maintained).

alter table public.open_slots
  add column if not exists last_touched_by_staff_id uuid references public.staff_users (id) on delete set null,
  add column if not exists last_touched_at timestamptz;

create index if not exists open_slots_last_touched_at_idx
  on public.open_slots (last_touched_at desc)
  where last_touched_at is not null;

comment on column public.open_slots.last_touched_by_staff_id is 'Staff user who last performed an operator action on this slot.';
comment on column public.open_slots.last_touched_at is 'Timestamp of last operator touch (confirm, offers, note, create, cancel, expire).';
