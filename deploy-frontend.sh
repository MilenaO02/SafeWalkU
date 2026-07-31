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

echo "[1.5/4] Preparando configuración pública de Google Maps..."
GOOGLE_MAPS_KEY="${VITE_GOOGLE_MAPS_API_KEY:-}"
GOOGLE_MAPS_MAP_ID="${VITE_GOOGLE_MAPS_MAP_ID:-DEMO_MAP_ID}"
if [[ -z "$GOOGLE_MAPS_KEY" ]]; then
  echo "ERROR: configura VITE_GOOGLE_MAPS_API_KEY en el entorno de despliegue" >&2
  exit 1
fi
if [[ ! "$GOOGLE_MAPS_KEY" =~ ^[A-Za-z0-9_-]+$ || ! "$GOOGLE_MAPS_MAP_ID" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "ERROR: la configuración de Google Maps contiene caracteres no válidos" >&2
  exit 1
fi
npm run build
printf "window.__SAFEWALK_CONFIG__ = Object.assign(window.__SAFEWALK_CONFIG__ || {}, { googleMapsApiKey: '%s', googleMapsMapId: '%s' });\\n" "$GOOGLE_MAPS_KEY" "$GOOGLE_MAPS_MAP_ID" > dist/map-config.js

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
