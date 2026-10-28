#!/bin/sh
# Applies pending migrations (and optional seed) before starting the API.
set -e
export PATH="$(pwd)/node_modules/.bin:$PATH"
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] applying database migrations"
  ./node_modules/.bin/prisma migrate deploy
fi
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] running seed"
  ./node_modules/.bin/prisma db seed
fi
exec "$@"
