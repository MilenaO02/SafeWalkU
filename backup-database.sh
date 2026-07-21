#!/usr/bin/env bash
set -e

BACKUP_DIR="${HOME}/backups/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/safewalku_backup_${TIMESTAMP}.sql"
DB_NAME="${DB_NAME:-safewalku}"
DB_USER="${DB_USER:-root}"

mkdir -p "$BACKUP_DIR"

echo "=== Generando Respaldo de Base de Datos MySQL: $DB_NAME ==="

if [ -n "$DB_PASSWORD" ]; then
    mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
else
    mysqldump -u "$DB_USER" -p "$DB_NAME" > "$BACKUP_FILE"
fi

gzip -f "$BACKUP_FILE"

echo "Respaldo creado en: ${BACKUP_FILE}.gz"
echo "=== Respaldo Finalizado Correctamente ==="
