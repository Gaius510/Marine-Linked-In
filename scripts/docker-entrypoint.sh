#!/bin/sh
set -eu

mkdir -p /app/db
./node_modules/.bin/prisma migrate deploy

exec "$@"
