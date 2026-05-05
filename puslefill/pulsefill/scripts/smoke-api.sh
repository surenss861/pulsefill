#!/usr/bin/env bash
# Repeatable Railway (or any) PulseFill API checks: health, readiness, CORS, optional rate limit.
# Usage:
#   PULSEFILL_API_BASE_URL=https://your-api.example.com \
#   PULSEFILL_DASHBOARD_ORIGIN=https://pulsefill.vercel.app \
#   ./scripts/smoke-api.sh
#
# Optional rate-limit probe (many requests; off by default):
#   SMOKE_RATE_LIMIT_CHECK=true \
#   SMOKE_RATE_LIMIT_MAX_ATTEMPTS=420 \
#   ./scripts/smoke-api.sh
#
# Global limit is 360 requests / 5 min per IP (see apps/api/src/plugins/rate-limit.ts);
# use SMOKE_RATE_LIMIT_MAX_ATTEMPTS >= 361 against production-like config.

set -euo pipefail

API_BASE_URL="${PULSEFILL_API_BASE_URL:-}"
DASHBOARD_ORIGIN="${PULSEFILL_DASHBOARD_ORIGIN:-https://pulsefill.vercel.app}"
RATE_LIMIT_CHECK="${SMOKE_RATE_LIMIT_CHECK:-false}"
RATE_LIMIT_MAX="${SMOKE_RATE_LIMIT_MAX_ATTEMPTS:-420}"

pass() {
  echo "PASS: $1"
}

fail() {
  echo "FAIL: $1"
  exit 1
}

if [[ -z "$API_BASE_URL" ]]; then
  echo "FAIL: PULSEFILL_API_BASE_URL is required"
  exit 1
fi

API_BASE_URL="${API_BASE_URL%/}"

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/pulsefill-smoke.XXXXXX")"
cleanup() {
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo "PulseFill API smoke"
echo "API: $API_BASE_URL"
echo "Dashboard origin: $DASHBOARD_ORIGIN"
echo ""

HEALTH_STATUS="$(curl -sS -o "$WORKDIR/health.body" -w "%{http_code}" "$API_BASE_URL/health" || true)"
if [[ "$HEALTH_STATUS" =~ ^2 ]]; then
  pass "/health returned $HEALTH_STATUS"
else
  cat "$WORKDIR/health.body" 2>/dev/null || true
  fail "/health returned ${HEALTH_STATUS:-curl_error}"
fi

READY_STATUS="$(curl -sS -o "$WORKDIR/ready.body" -w "%{http_code}" "$API_BASE_URL/ready" || true)"
if [[ "$READY_STATUS" =~ ^2 ]]; then
  pass "/ready returned $READY_STATUS"
else
  cat "$WORKDIR/ready.body" 2>/dev/null || true
  fail "/ready returned ${READY_STATUS:-curl_error}"
fi

curl -sS -i -X OPTIONS "$API_BASE_URL/v1/businesses/mine" \
  -H "Origin: $DASHBOARD_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -o "$WORKDIR/cors.txt" || fail "CORS preflight curl failed"

# Match header value (case-insensitive name); allow exact origin echo from API.
if grep -qi "access-control-allow-origin:" "$WORKDIR/cors.txt" && grep -qiF "$DASHBOARD_ORIGIN" "$WORKDIR/cors.txt"; then
  pass "CORS preflight reflects $DASHBOARD_ORIGIN (OPTIONS /v1/businesses/mine)"
else
  echo "--- OPTIONS /v1/businesses/mine response ---"
  cat "$WORKDIR/cors.txt"
  fail "CORS did not allow Origin $DASHBOARD_ORIGIN (check API_CORS_ORIGINS on the API host)"
fi

if [[ "$RATE_LIMIT_CHECK" == "true" ]]; then
  echo ""
  echo "Optional rate-limit smoke (up to $RATE_LIMIT_MAX GETs, unauthenticated /v1/businesses/mine → expect 401 until 429)…"

  hit_429="false"
  last_status=""
  for ((i = 1; i <= RATE_LIMIT_MAX; i++)); do
    last_status="$(curl -sS -o "$WORKDIR/rate.body" -w "%{http_code}" \
      "$API_BASE_URL/v1/businesses/mine" || echo "000")"

    if [[ "$last_status" == "429" ]]; then
      hit_429="true"
      break
    fi
  done

  if [[ "$hit_429" != "true" ]]; then
    echo "Last HTTP status: ${last_status:-unknown}"
    cat "$WORKDIR/rate.body" 2>/dev/null || true
    fail "rate-limit smoke did not observe 429 within $RATE_LIMIT_MAX attempts (is RATE_LIMIT_DISABLED set, or limit higher than attempt count?)"
  fi

  if grep -q "rate_limited" "$WORKDIR/rate.body" && grep -q "request_id" "$WORKDIR/rate.body"; then
    pass "rate limit returned 429 with rate_limited + request_id in body"
  else
    cat "$WORKDIR/rate.body"
    fail "429 body missing expected rate_limited and/or request_id"
  fi
fi

echo ""
echo "Smoke complete."
