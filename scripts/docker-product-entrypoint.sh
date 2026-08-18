#!/bin/sh
set -e
trap 'kill 0' TERM INT

pnpm --filter @carparty/web start &
pnpm --filter @carparty/bot start &

wait
