#!/bin/sh
set -e
trap 'kill 0' TERM INT

pnpm --filter @carparty/web start &

if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  pnpm --filter @carparty/bot start &
else
  echo "[product] TELEGRAM_BOT_TOKEN is not set — Telegram bot not started."
fi

wait
