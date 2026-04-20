-- Per-customer notification timing / cadence / toggles (V1).

create table if not exists public.customer_notification_preferences (
  customer_id uuid primary key references public.customers (id) on delete cascade,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start_local time,
  quiet_hours_end_local time,
  cadence_preference text not null default 'all_opportunities',
  notify_new_offers boolean not null default true,
  notify_claim_updates boolean not null default true,
  notify_booking_confirmations boolean not null default true,
  notify_standby_tips boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint customer_notification_preferences_cadence_chk check (
    cadence_preference in (
      'all_opportunities',
      'best_matches',
      'important_only'
    )
  )
);

create index if not exists customer_notification_preferences_updated_idx
  on public.customer_notification_preferences (updated_at desc);
