-- Optional display name for staff context; magic-link token copy for pending invites (cleared on accept/revoke).

alter table public.customer_invites
  add column if not exists customer_name text,
  add column if not exists invite_token text;

comment on column public.customer_invites.customer_name is
  'Optional label from staff when creating the invite; not validated as customer legal name.';

comment on column public.customer_invites.invite_token is
  'Same value as the customer magic-link token while invite is pending; for staff copy in dashboard; null after accept/revoke.';

create unique index if not exists customer_invites_invite_token_uidx
  on public.customer_invites (invite_token)
  where invite_token is not null;
