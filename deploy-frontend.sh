#!/usr/bin/env bash
set -e

echo "=== Desplegando Frontend SafeWalk U ==="
CDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$CDIR/frontend"
TARGET_DIR="/var/www/safewalku/dist"

cd "$FRONTEND_DIR"

echo "[1/3] Copiando frontend precompilado a $TARGET_DIR..."
sudo mkdir -p /var/www/safewalku/dist
sudo cp -r dist/* /var/www/safewalku/dist/

echo "[2/3] Verificando permisos de lectura Nginx..."
sudo chown -R www-data:www-data /var/www/safewalku
sudo chmod -R 755 /var/www/safewalku

echo "[3/3] Verificando Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "=== Despliegue de Frontend Completado Exitosamente ==="
