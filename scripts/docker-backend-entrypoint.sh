#!/bin/sh
set -e
trap 'kill 0' TERM INT

node apps/api/dist/main.js &
pnpm --filter @carparty/collector start &

wait
