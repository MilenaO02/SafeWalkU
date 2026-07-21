#!/usr/bin/env bash
set -e

echo "=== Desplegando Backend SafeWalk U ==="
CDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$CDIR/backend"

cd "$BACKEND_DIR"

echo "[1/5] Actualizando código fuente..."
# git pull origin main

echo "[2/5] Instalando dependencias limpia..."
npm ci

echo "[3/5] Compilando TypeScript..."
npm run build

echo "[4/5] Creando directorio de uploads si no existe..."
mkdir -p uploads logs

echo "[5/5] Recargando proceso con PM2 sin interrupción (Zero-downtime reload)..."
if pm2 list | grep -q "safewalk-backend"; then
    pm2 reload ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo "=== Verificando Health Check ==="
sleep 2
curl -f http://localhost:3000/api/health || echo "ADVERTENCIA: Healthcheck falló. Revisa pm2 logs."

echo "=== Despliegue de Backend Completado Exitosamente ==="
