#!/usr/bin/env bash
# ============================================================
# Warung App — MySQL restore drill
#
# Restores a backup created by scripts/backup.sh.
# Supports plain .sql.gz and age-encrypted .sql.gz.age files.
#
# Requirements:
#   - mysql client
#   - age (only when restoring an encrypted backup)
#
# Usage (plain):
#   DB_NAME=warung ./scripts/restore.sh backups/warung-20260903-000000.sql.gz
#
# Usage (encrypted):
#   AGE_IDENTITY=/path/to/key.txt DB_NAME=warung \
#     ./scripts/restore.sh backups/warung-20260903-000000.sql.gz.age
#
# Env vars:
#   DATABASE_URL / DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
#   AGE_IDENTITY   age private key file (only for .age backups)
#   CONFIRM=yes    skip the interactive confirmation prompt
# ============================================================
set -euo pipefail

BACKUP_FILE="${1:?Usage: restore.sh <backup-file>}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# --- Parse DATABASE_URL ---
if [ -n "${DATABASE_URL:-}" ]; then
  DB_HOST="${DB_HOST:-$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]*@([^:/]+).*|\1|')}"
  DB_PORT="${DB_PORT:-$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]*@[^:]+:([0-9]+)/.*|\1|')}"
  DB_USER="${DB_USER:-$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')}"
  DB_PASSWORD="${DB_PASSWORD:-$(echo "$DATABASE_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')}"
  DB_NAME="${DB_NAME:-$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]*@[^/]+/([^?]+).*|\1|')}"
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:?DB_USER or DATABASE_URL required}"
DB_NAME="${DB_NAME:?DB_NAME or DATABASE_URL required}"

if [ "${CONFIRM:-}" != "yes" ]; then
  echo "WARNING: this will OVERWRITE database '${DB_NAME}' on ${DB_HOST}:${DB_PORT}."
  read -r -p "Type 'restore' to continue: " ans
  [ "$ans" = "restore" ] || { echo "Aborted."; exit 1; }
fi

# --- Decrypt if needed ---
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

case "$BACKUP_FILE" in
  *.age)
    [ -n "${AGE_IDENTITY:-}" ] || { echo "ERROR: AGE_IDENTITY required for encrypted backup" >&2; exit 1; }
    echo "[restore] Decrypting..."
    age -d -i "$AGE_IDENTITY" "$BACKUP_FILE" > "$TMP/restore.sql.gz"
    DECOMPRESSED="$TMP/restore.sql.gz"
    ;;
  *.gz)
    DECOMPRESSED="$BACKUP_FILE"
    ;;
  *)
    echo "ERROR: unsupported backup format (expected .sql.gz or .sql.gz.age)" >&2
    exit 1
    ;;
esac

# --- Restore ---
echo "[restore] Restoring ${DB_NAME} on ${DB_HOST}:${DB_PORT}..."
gunzip -c "$DECOMPRESSED" | MYSQL_PWD="${DB_PASSWORD:-}" mysql \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME"

echo "[restore] Restore complete."
