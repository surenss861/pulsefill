#!/usr/bin/env bash
# One-time: apply 0018 + 0019 to Postgres (e.g. Supabase session pooler or direct connection).
# Usage:  export DATABASE_URL="postgresql://..."  # from Supabase → Project Settings → Database
#         ./scripts/apply-customer-invite-migrations.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG="${ROOT}/packages/db/migrations"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL to your Supabase Postgres connection string (include ssl if required), then re-run."
  echo "Or paste 0018 then 0019 in the Supabase SQL Editor."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required (install Postgres client or use Supabase SQL Editor instead)."
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "${MIG}/0018_customer_invites.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "${MIG}/0019_customer_invites_accepted_by.sql"

echo ""
echo "=== public.customer_invites columns ==="
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'customer_invites'
order by ordinal_position;
"
echo "Done. Confirm accepted_by_customer_id is listed."
