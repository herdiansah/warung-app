# Warung App

Warung App is an open-source sales, inventory, and profit-recording application for Indonesian micro-retail businesses ("warung") and neighborhood shops. It is designed to make daily shop operations approachable without accounting expertise.

Read this in [Bahasa Indonesia](README.id.md).

## Current features

- Dashboard for daily sales, transaction count, best-selling products, and low-stock alerts.
- Product management with pricing, stock, categories, search, soft deletion for sold products, and bulk import from XLSX/CSV.
- Point-of-sale (POS) checkout with server-side pricing and stock validation, plus barcode scanner input.
- Offline-first PWA: checkout intents are queued in IndexedDB and synced with idempotency keys when the connection returns.
- Stock adjustments and an auditable stock-movement history.
- Monthly sales reports with revenue, transaction totals, gross profit, and best-selling products.
- Daily closing report (tutup kasir) with variance tracking and approval.
- Purchase/restock workflow with automatic cash-out on kulakan.
- Customer receivables ledger and cash movement ledger (kas masuk/kas keluar).
- Transaction void/reversal workflow with a recorded reason.
- Multi-role access (owner, manager, cashier) with server-side authorization and an audit log.
- CSV/XLSX export for products, stock, sales, and reports.
- JWT-protected API endpoints and bcrypt password hashes.
- Health endpoints for liveness (`/api/health`) and readiness (`/api/health/ready`).
- Structured logging with `LOG_LEVEL` filtering, JSON output, and an error-tracking webhook hook.

## Status

Actively maintained. Version 1.0.0. Requires MySQL (compatible with TiDB Serverless). See [CHANGELOG.md](CHANGELOG.md) for release history and [MILESTONES.md](docs/MILESTONES.md) for the roadmap.

## Tech stack

- Frontend: React 19, Vite, Tailwind CSS, React Router.
- Backend: Node.js, Express, TypeScript.
- Data: MySQL and Prisma ORM.

## Quick start

Prerequisites: Node.js 22+, MySQL 8+, and npm.

```bash
git clone https://github.com/herdiansah/warung-app.git
cd warung-app
npm ci
cp .env.example .env
```

Edit `.env` with a MySQL connection string and a unique `JWT_SECRET` that is at least 32 characters. The server defaults to `127.0.0.1:3000`; place it behind a reverse proxy when public access is needed.

Apply migrations, create the first owner account, and start development mode:

```bash
npx prisma migrate dev
ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='use-a-unique-12-plus-character-password' npm run prisma -- db seed
npm run dev
```

The development server runs at `http://127.0.0.1:3000`.

## Quality checks

```bash
npm test        # API integration tests (Vitest)
npm run test:e2e # Playwright E2E smoke tests
npm run lint
npm run build
```

## Production deployment

Warung App ships with a production Docker image (multi-stage build, non-root runtime, HEALTHCHECK) and a `docker-compose.yml` example:

```bash
# Fill in .env first, then:
docker compose up -d --build
```

For bare-metal deployment, backups, restore drills, upgrade, and rollback steps, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `pretty` | `pretty` (colored console + `logs/app.log`) or `json` (stdout, collector-ready) |
| `ERROR_WEBHOOK_URL` | (unset) | POSTs every error-level log as JSON to this URL (e.g. Sentry-compatible ingest, Slack webhook) |

## Backups

Run `scripts/backup.sh` manually, via cron, or in Docker to produce a gzipped (optionally age-encrypted) MySQL dump with retention; `scripts/restore.sh` restores it. Full drill in [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security

- Never commit `.env`, database dumps, customer data, or credentials.
- Initial owner credentials are provided only when running the seed command; the application does not create a default account.
- Read [SECURITY.md](SECURITY.md) for vulnerability reporting and deployment guidance.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. Maintainers: see [MAINTAINERS.md](docs/MAINTAINERS.md). Community participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

Warung App is released under the [MIT License](LICENSE).
