#!/usr/bin/env bash
set -e

echo "=== Desplegando Backend SafeWalk U ==="
CDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$CDIR/backend"

cd "$BACKEND_DIR"

echo "[1/4] Instalando dependencias en producción..."
npm ci --only=production
npm cache clean --force

echo "[2/4] Creando directorios de datos..."
mkdir -p uploads logs

echo "[3/4] Recargando proceso con PM2 sin interrupción (Zero-downtime reload)..."
if pm2 list | grep -q "safewalk-backend"; then
    pm2 reload ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo "[4/4] Verificando Health Check..."
sleep 2
curl -f http://localhost:3000/api/health || echo "ADVERTENCIA: Healthcheck falló. Revisa pm2 logs."

echo "=== Despliegue de Backend Completado Exitosamente ==="
