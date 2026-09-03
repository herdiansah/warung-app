#!/usr/bin/env bash
# ============================================================
# Warung App — MySQL backup script
#
# Dumps the database, compresses it, optionally encrypts with
# age, applies retention policy, and can push to an S3 bucket
# (or any S3-compatible object store) via aws/rclone.
#
# Requirements:
#   - mysqldump (mysql-client)
#   - gzip
#   - age (optional, for encryption)  https://age-encryption.org
#   - aws or rclone (optional, for offsite copy)
#
# Usage:
#   BACKUP_DIR=/var/backups/warung ./scripts/backup.sh
#
# Env vars:
#   DATABASE_URL     mysql://user:pass@host:port/dbname  (or individual vars below)
#   DB_HOST          default 127.0.0.1
#   DB_PORT          default 3306
#   DB_USER          default from DATABASE_URL
#   DB_PASSWORD      default from DATABASE_URL
#   DB_NAME          default from DATABASE_URL
#   BACKUP_DIR       default ./backups
#   KEEP_DAYS        default 14  (retention for local files)
#   AGE_RECIPIENT    age public key -> enables encryption
#   S3_BUCKET        s3://bucket/path -> enables offsite copy (aws or rclone)
# ============================================================
set -euo pipefail

# --- Parse DATABASE_URL: mysql://user:pass@host:port/dbname ---
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

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
TS="$(date +%Y%m%d-%H%M%S)"
STAMP="${DB_NAME}-${TS}"
mkdir -p "$BACKUP_DIR"

log() { echo "[backup] $(date -Is) $*"; }

# --- Dump + compress ---
log "Dumping ${DB_NAME} from ${DB_HOST}:${DB_PORT}..."
MYSQL_PWD="${DB_PASSWORD:-}" mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" \
  | gzip -9 > "${BACKUP_DIR}/${STAMP}.sql.gz"

SIZE=$(du -h "${BACKUP_DIR}/${STAMP}.sql.gz" | cut -f1)
log "Dump ok: ${BACKUP_DIR}/${STAMP}.sql.gz (${SIZE})"

# --- Encrypt (optional) ---
if [ -n "${AGE_RECIPIENT:-}" ]; then
  log "Encrypting with age..."
  age -r "$AGE_RECIPIENT" "${BACKUP_DIR}/${STAMP}.sql.gz" > "${BACKUP_DIR}/${STAMP}.sql.gz.age"
  rm "${BACKUP_DIR}/${STAMP}.sql.gz"
  FINAL="${BACKUP_DIR}/${STAMP}.sql.gz.age"
else
  FINAL="${BACKUP_DIR}/${STAMP}.sql.gz"
fi

# --- Offsite copy (optional) ---
if [ -n "${S3_BUCKET:-}" ]; then
  if command -v rclone >/dev/null 2>&1; then
    log "Uploading to ${S3_BUCKET} via rclone..."
    rclone copyto "$FINAL" "${S3_BUCKET%/}/${STAMP}.sql.gz.age" --no-check-dest
  elif command -v aws >/dev/null 2>&1; then
    log "Uploading to ${S3_BUCKET} via aws..."
    aws s3 cp "$FINAL" "${S3_BUCKET%/}/${STAMP}.sql.gz.age"
  else
    log "WARN: S3_BUCKET set but neither rclone nor aws installed; skipped offsite copy"
  fi
fi

# --- Retention ---
log "Cleaning local backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -name "${DB_NAME}-*" -mtime "+${KEEP_DAYS}" -delete

log "Backup complete: ${FINAL}"
