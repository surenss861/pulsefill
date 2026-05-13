-- Optional public-facing fields for customer directory (waitlist-first discovery).
-- Internal `businesses.name` / `category` / locations remain source of truth; these override when set.

alter table public.businesses
  add column if not exists public_display_name text,
  add column if not exists public_description text,
  add column if not exists public_category text,
  add column if not exists public_city text,
  add column if not exists public_neighborhood text,
  add column if not exists public_website text,
  add column if not exists public_phone text,
  add column if not exists public_logo_url text,
  add column if not exists public_cover_image_url text,
  add column if not exists public_join_note text;

comment on column public.businesses.public_display_name is 'Directory headline; falls back to businesses.name.';
comment on column public.businesses.public_description is 'Customer-safe blurb for directory detail; falls back to app default copy.';
comment on column public.businesses.public_category is 'Directory category line; falls back to businesses.category.';
comment on column public.businesses.public_city is 'Directory city; falls back to primary location city when unset.';
comment on column public.businesses.public_neighborhood is 'Directory neighborhood / area label; falls back to primary location name when unset.';
comment on column public.businesses.public_website is 'Optional public website URL for directory (not internal ops email).';
comment on column public.businesses.public_phone is 'Optional public phone for directory.';
comment on column public.businesses.public_logo_url is 'Optional HTTPS URL for square logo in directory.';
comment on column public.businesses.public_cover_image_url is 'Optional HTTPS URL for cover art in directory.';
comment on column public.businesses.public_join_note is 'Optional short note shown near the join CTA (e.g. hours, eligibility).';
