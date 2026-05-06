-- Optional follow-up reminder on internal customer notes (staff-only).

alter table public.customer_notes
  add column if not exists follow_up_at timestamptz,
  add column if not exists follow_up_completed_at timestamptz;

alter table public.customer_notes
  add constraint customer_notes_follow_up_complete_requires_scheduled_chk
  check (follow_up_completed_at is null or follow_up_at is not null);

create index if not exists customer_notes_open_follow_up_idx
  on public.customer_notes (business_id, follow_up_at asc)
  where deleted_at is null
    and follow_up_at is not null
    and follow_up_completed_at is null;

comment on column public.customer_notes.follow_up_at is
  'When staff should follow up on this note; null if no reminder.';
comment on column public.customer_notes.follow_up_completed_at is
  'Set when staff marks the follow-up done; null while open.';
