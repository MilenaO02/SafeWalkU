#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

test -f .env || { echo "ERROR: falta .env" >&2; exit 1; }
grep -Eq '^CORS_ORIGIN=https://safewalku\.online,https://www\.safewalku\.online$' .env || { echo "ERROR: CORS_ORIGIN no corresponde al dominio" >&2; exit 1; }
grep -Eq '^OPENROUTESERVICE_API_KEY=.{10,}$' .env || { echo "ERROR: falta OPENROUTESERVICE_API_KEY" >&2; exit 1; }

docker compose config --quiet
docker compose up -d --build
docker compose exec -T backend npm run migrate:routes

for attempt in {1..15}; do
    if curl --fail --silent http://127.0.0.1:8080/api/health >/dev/null; then
        echo "SafeWalk U desplegado y conectado a MySQL."
        exit 0
    fi
    sleep 2
done

echo "ERROR: el health check no respondio" >&2
docker compose logs --tail=100 backend frontend
exit 1
