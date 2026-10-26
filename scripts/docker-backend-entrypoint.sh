#!/bin/sh
set -e
trap 'kill 0' TERM INT

# Schema sync, plus seed data on an empty database when SEED_MODE is base or demo.
pnpm --filter @carparty/database ensure-demo

node apps/api/dist/main.js &

# Collectors run only when at least one source is configured.
if [ -n "$TELEGRAM_API_ID" ] || [ -n "$TELEGRAM_PUBLIC_CHANNELS" ] || [ -n "$AUTORIA_API_KEY" ] || [ "$OLX_ENABLED" = "true" ]; then
  pnpm --filter @carparty/collector start &
else
  echo "[backend] No listing sources configured (TELEGRAM_PUBLIC_CHANNELS, TELEGRAM_API_ID, AUTORIA_API_KEY, OLX_ENABLED) — collector not started."
fi

wait
