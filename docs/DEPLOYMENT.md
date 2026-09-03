# Deployment Guide

## Prerequisites

- Node.js 22+ and npm
- MySQL 8+ (or TiDB Serverless)
- Docker (optional, for containerized deployment)

## Production (npm)

```bash
# Clone and install
git clone https://github.com/herdiansah/warung-app.git
cd warung-app
npm ci

# Configure
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, ADMIN_*

# Migrate and seed
npx prisma migrate deploy
ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='<password>' npm run seed

# Build frontend
npm run build

# Start
NODE_ENV=production npm start
```

The server listens on `127.0.0.1:3000` by default. Put a reverse proxy (Nginx, Caddy) in front for public access.

## Production (Docker)

```bash
# Configure
cp .env.example .env
# Edit .env values

# Build and start
docker compose up -d --build

# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed
docker compose exec -e ADMIN_EMAIL=owner@example.com -e ADMIN_PASSWORD='<password>' app npx prisma db seed
```

## Reverse Proxy (Nginx example)

```nginx
server {
    listen 80;
    server_name warung.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Logging

Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `pretty` | `pretty` (colored console + file), `json` (JSON output to stdout) |
| `ERROR_WEBHOOK_URL` | (unset) | POSTs every ERROR-level log as JSON to this URL |

## Backups

### Manual backup

```bash
# Using the backup script
DATABASE_URL="mysql://user:pass@host:3306/dbname" ./scripts/backup.sh
```

### Automated backup (cron)

```bash
# Run daily at 03:00
0 3 * * * BACKUP_DIR=/var/backups/warung KEEP_DAYS=14 DATABASE_URL="..." /path/to/warung-app/scripts/backup.sh
```

### Encrypted backup

Generate an age key and set `AGE_RECIPIENT`:

```bash
age-keygen -o key.txt
export AGE_RECIPIENT="age1..."
export BACKUP_DIR=/var/backups/warung
./scripts/backup.sh
```

### Offsite backup (S3/R2)

Set `S3_BUCKET` and install `rclone` or `aws` CLI:

```bash
export S3_BUCKET="s3://my-bucket/warung-backups"
./scripts/backup.sh
```

### Restore

```bash
# Plain backup
./scripts/restore.sh backups/warung-20260903-010000.sql.gz

# Encrypted backup
AGE_IDENTITY=/path/to/key.txt ./scripts/restore.sh backups/warung-20260903-010000.sql.gz.age
```

## Upgrade

1. Pull latest code: `git pull`
2. Install new dependencies: `npm ci`
3. Apply new migrations: `npx prisma migrate deploy`
4. Rebuild frontend: `npm run build`
5. Restart the server

For Docker:

```bash
git pull
docker compose down
docker compose build --pull
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## Rollback

1. Checkout previous tag: `git checkout v0.5.0`
2. Install deps: `npm ci`
3. Roll back the last migration: `npx prisma migrate reset`
4. Optionally restore a database backup

## Security Audit

Run a security audit periodically:

```bash
npm audit
```

For Docker:

```bash
docker scan warung-app:latest
```

Review dependencies weekly via Dependabot PRs (configured in `.github/dependabot.yml`).

## Health Checks

The app exposes two endpoints:

- `GET /api/health` — liveness (always 200)
- `GET /api/health/ready` — readiness (200 if DB reachable, 503 otherwise)

Docker HEALTHCHECK uses `/api/health` by default.