#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups/mysql}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
DB_NAME="${DB_NAME:-safewalku}"
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
BACKUP_FILE="${BACKUP_DIR}/safewalku_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"
echo "=== Respaldando MySQL: $DB_NAME ==="

DUMP_ARGS=(--host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --single-transaction --routines --triggers "$DB_NAME")
if [ -n "${DB_PASSWORD:-}" ]; then
    MYSQL_PWD="$DB_PASSWORD" mysqldump "${DUMP_ARGS[@]}" > "$BACKUP_FILE"
else
    mysqldump -p "${DUMP_ARGS[@]}" > "$BACKUP_FILE"
fi

gzip -f "$BACKUP_FILE"
echo "Respaldo creado: ${BACKUP_FILE}.gz"
