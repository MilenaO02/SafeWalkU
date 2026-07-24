#!/usr/bin/env bash
set -Eeuo pipefail

echo "=== Desplegando backend SafeWalk U ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
cd "$BACKEND_DIR"

echo "[1/6] Instalando dependencias y compilando..."
npm ci
npm run build
npm prune --omit=dev

echo "[2/6] Creando directorios de datos..."
mkdir -p uploads logs

echo "[3/6] Validando variables obligatorias..."
test -f .env || { echo "ERROR: falta backend/.env" >&2; exit 1; }
grep -Eq '^JWT_SECRET=.{32,}$' .env || { echo "ERROR: JWT_SECRET debe tener al menos 32 caracteres" >&2; exit 1; }

echo "[4/6] Aplicando migraciones idempotentes..."
npm run migrate:routes

echo "[5/6] Recargando proceso con PM2..."
if pm2 describe safewalk-backend >/dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo "[6/6] Verificando health check..."
for attempt in {1..10}; do
    if curl --fail --silent --show-error http://localhost:3000/api/health; then
        echo
        echo "=== Despliegue de backend completado ==="
        exit 0
    fi
    sleep 2
done

echo "ERROR: health check fallido. Ejecuta: pm2 logs safewalk-backend" >&2
exit 1
