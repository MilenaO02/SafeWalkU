#!/usr/bin/env bash
set -Eeuo pipefail

echo "=== Desplegando frontend SafeWalk U ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
TARGET_DIR="/var/www/safewalku/dist"
cd "$FRONTEND_DIR"

echo "[1/4] Instalando dependencias y compilando..."
npm ci
npm run lint

echo "[1.5/4] Configurando variables de entorno..."
cat > .env.production <<EOF
VITE_API_URL=/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDSC0LKYzU8isK6WvkM-DxGbKjwY4bsp4k
VITE_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
EOF
npm run build

echo "[2/4] Publicando archivos compilados..."
sudo mkdir -p "$TARGET_DIR/assets"
# Publicar primero los chunks con hash y conservar los anteriores durante un
# periodo de gracia evita romper pestañas abiertas durante un despliegue.
sudo rsync -a dist/assets/ "$TARGET_DIR/assets/"
sudo rsync -a --exclude 'assets/' dist/ "$TARGET_DIR/"
sudo find "$TARGET_DIR/assets" -type f -mtime +14 -delete

echo "[3/4] Configurando permisos de lectura..."
sudo chown -R www-data:www-data /var/www/safewalku
sudo find /var/www/safewalku -type d -exec chmod 755 {} \;
sudo find /var/www/safewalku -type f -exec chmod 644 {} \;

echo "[4/4] Validando y recargando Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "=== Despliegue de frontend completado ==="
