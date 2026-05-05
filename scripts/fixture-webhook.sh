#!/usr/bin/env bash
# Sends a signed fixture webhook to /api/webhooks/elevenlabs.
# Reads ELEVENLABS_WEBHOOK_SECRET from .env.local.
#
# Usage:
#   ./scripts/fixture-webhook.sh                       # local dev (http://localhost:3000)
#   ./scripts/fixture-webhook.sh https://your.vercel.app
#
# The script signs payload with HMAC-SHA256 using the same scheme as
# ElevenLabs (header: t=<unix_ts>,v0=<hex>).

set -euo pipefail

# Resolve project root (script lives in scripts/, env file in project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ ! -f "${PROJECT_ROOT}/.env.local" ]]; then
  echo "ERROR: ${PROJECT_ROOT}/.env.local not found." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
source "${PROJECT_ROOT}/.env.local"
set +a

SECRET="${ELEVENLABS_WEBHOOK_SECRET:?ELEVENLABS_WEBHOOK_SECRET must be set in .env.local}"
BASE_URL="${1:-http://localhost:3000}"
URL="${BASE_URL%/}/api/webhooks/elevenlabs"

CONV_ID="conv_smoke_$(date +%s)"
START_TS=$(date +%s)

# Compact JSON (no newlines) — HMAC must match exactly what we send.
PAYLOAD=$(cat <<EOF | tr -d '\n'
{"type":"post_call_transcription","data":{"conversation_id":"${CONV_ID}","transcript":[{"role":"agent","message":"Hi.","time_in_call_secs":0},{"role":"user","message":"Tell me about politics.","time_in_call_secs":3},{"role":"agent","message":"Outside my brief, I'm afraid.","time_in_call_secs":5}],"metadata":{"start_time_unix_secs":${START_TS},"call_duration_secs":60,"termination_reason":"client_disconnected"},"analysis":{"transcript_summary":"Smoke test.","data_collection_results":{"visitor_name":{"value":"Smoke Tester"},"topic_tags":{"value":["cv"]},"sentiment":{"value":"neutral"},"language":{"value":"en"}}}}}
EOF
)

TS=$(date +%s)
SIG=$(printf '%s.%s' "$TS" "$PAYLOAD" \
  | openssl dgst -sha256 -hmac "$SECRET" \
  | sed 's/^.* //')

echo "Posting to: ${URL}"
echo "conversation_id: ${CONV_ID}"
echo

curl -i -X POST "$URL" \
  -H "content-type: application/json" \
  -H "elevenlabs-signature: t=${TS},v0=${SIG}" \
  --data "$PAYLOAD"

echo
echo
echo "Done. Check Supabase 'sessions' table for conversation_id=${CONV_ID}."
echo "Expected fields: end_reason='unknown', quality_flags.refusals=1, quality_flags.oos_attempts=1."
