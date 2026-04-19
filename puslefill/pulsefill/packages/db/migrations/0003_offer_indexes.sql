-- Query paths for matching, expiry sweeps, and inbox views.

create index slot_offers_expires_at_status_idx
  on public.slot_offers (expires_at, status);

create index slot_offers_open_slot_status_idx
  on public.slot_offers (open_slot_id, status);

create index open_slots_business_status_starts_idx
  on public.open_slots (business_id, status, starts_at desc);

create index standby_preferences_match_idx
  on public.standby_preferences (business_id, active)
  where (active = true);
