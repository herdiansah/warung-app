# Changelog

All notable changes to Warung App are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] — 2026-09-03

### Added
- Production Docker image: multi-stage build, non-root runtime, HEALTHCHECK
- docker-compose.yml example (app + MySQL) with health checks
- `GET /api/health` (liveness) and `GET /api/health/ready` (readiness + DB ping)
- Structured JSON logging (`LOG_FORMAT=json`) for log collectors
- `LOG_LEVEL` filtering (debug/info/warn/error)
- Error tracking integration point via `ERROR_WEBHOOK_URL` env
- `scripts/backup.sh` — MySQL dump with gzip, optional age encryption, S3 upload, and retention
- `scripts/restore.sh` — restore from plain or age-encrypted backups
- `docs/DEPLOYMENT.md` — production deployment, backup, restore, upgrade, rollback
- `CHANGELOG.md` — versioned changelog
- `README.id.md` — Indonesian translation of README
- Dependabot configuration for npm dependency updates

### Changed
- Logger now supports JSON output, LOG_LEVEL filtering, and error webhook
- `server.ts` imports vite dynamically (dev only) — no longer a runtime dependency
- `package.json` — added `start` script for production; `private: false` for OSS
- Docker Compose logs in JSON format by default

### Fixed
- Health endpoint responds 200/503 with DB status for readiness checks

## [0.5.0] — 2026-09-03

### Added
- M4 — Operational reporting and business workflows:
  - CSV/XLSX export for products, stock history, daily and monthly sales
  - Purchase/restock workflow (auto cash-out on kulakan)
  - Customer receivables ledger, cash movement ledger
  - Daily closing report (tutup kasir) with variance tracking
  - Barcode scanner support (field, lookup endpoint, POS scan input)
  - Data import from XLSX/CSV with validation, upsert by barcode/name, row error reporting
  - `data-testid` attributes on Login, nav, Products, POS, Customers for E2E testing
  - Playwright E2E smoke tests (8 tests) — `npm run test:e2e`
  - E2E test script `npm run test:e2e`

## [0.4.0] — 2026-08-30

### Added
- M3 — Store accounts, roles, and auditability:
  - `Store` ownership for business data with migration
  - Roles: owner, manager, cashier with server-side authorization
  - Transaction void/reversal workflow with reason field
  - Append-only audit log for sign-in, checkout, adjustments, settings, voids

## [0.3.0] — 2026-08-25

### Added
- M2 — Offline-first PWA POS:
  - Web app manifest, service worker, install prompt
  - Offline checkout intents in IndexedDB with idempotency key
  - Server-side idempotency handling
  - Sync queue states and conflict resolution screen

## [0.2.0] — 2026-08-20

### Added
- M1 — Transaction and inventory integrity:
  - API integration tests (Supertest + Vitest)
  - Input schema validation for all write endpoints (400/401/403/404)
  - Concurrency-safe stock decrement (prevent overselling)
  - Immutable stock audit trail (actor, reason, reference_id)
  - Historical cost at checkout backfill
  - Timezone-aware daily/monthly reporting (Asia/Jakarta)

## [0.1.0] — 2026-08-15

### Added
- M0 — Local developer baseline:
  - `.env` setup guide and `.env.example`
  - Prisma seed with bcrypt (no default passwords)
  - TiDB Serverless connection validation
  - OSS governance files (LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT)
  - GitHub Actions CI workflow