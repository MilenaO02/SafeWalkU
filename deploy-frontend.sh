#!/usr/bin/env bash
set -e

echo "=== Desplegando Frontend SafeWalk U ==="
CDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$CDIR/frontend"
TARGET_DIR="/var/www/safewalku/dist"

cd "$FRONTEND_DIR"

echo "[1/4] Actualizando código fuente..."
# git pull origin main

echo "[2/4] Instalando dependencias limpia..."
npm ci

echo "[3/4] Compilando con Vite..."
npm run build

echo "[4/4] Copiando a producción $TARGET_DIR..."
sudo mkdir -p /var/www/safewalku
sudo cp -r dist/* /var/www/safewalku/dist/

echo "Verificando Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "=== Despliegue de Frontend Completado Exitosamente ==="
