-- Optional local seed: adjust UUIDs if you wire real auth users.

insert into public.businesses (id, name, slug, category, timezone)
values (
  '11111111-1111-1111-1111-111111111111',
  'Demo Med Spa',
  'demo-med-spa',
  'med_spa',
  'America/Los_Angeles'
)
on conflict (id) do nothing;

insert into public.locations (id, business_id, name, city, region)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Main',
  'Los Angeles',
  'CA'
)
on conflict (id) do nothing;
