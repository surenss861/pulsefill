alter table public.notification_logs
  add column if not exists metadata jsonb not null default '{}';
