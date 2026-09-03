# Warung App Milestones

## Purpose

Warung App is an open-source, self-hostable POS, inventory, and profit-recording tool for Indonesian micro-retail businesses. These milestones prioritize data integrity, secure operation, offline resilience, and a healthy contributor experience over feature volume.

## Operating rules

- Work from a feature branch and merge through a pull request.
- Every code change requires a regression test or a documented reason why it cannot be automated.
- Run `npm test`, `npm run lint`, `npm run build`, and `npx prisma validate` before a release.
- Never commit `.env`, production database dumps, customer data, credentials, or JWT secrets.
- Use a new Prisma migration for every production schema change; do not rewrite an applied migration.
- Publish a release note and migration/rollback notes for every release.

## M0 — Local developer baseline

Goal: Make a fresh clone reliably runnable and safe for contributors.

Deliverables:
- [x] Create local `.env` from `.env.example` with MySQL `DATABASE_URL`, a unique 32+ character `JWT_SECRET`, and initial admin values.
- [x] Confirm migrations apply cleanly to an empty MySQL database.
- [x] Confirm `prisma db seed` creates an owner with a bcrypt hash and never uses a default password.
- [x] Add Docker Compose for MySQL plus a documented development command.
- [x] Add a production deployment guide for reverse proxy, loopback binding, database migration, backup, and log rotation.
- [x] Add a GitHub issue template for bugs and feature requests.

Acceptance criteria:
- A new contributor can clone, configure, migrate, seed, run, test, lint, and build without undocumented steps.
- No secret or generated database file is tracked by Git.

Target release: v0.1.0

## M1 — Transaction and inventory integrity

Goal: Ensure checkout, stock, and financial records remain correct under valid and invalid requests.

Deliverables:
- [x] Add API integration tests for login, product CRUD, checkout, stock adjustment, and transaction deletion.
- [x] Enforce input schemas for all write endpoints and return consistent 400/401/403/404 errors.
- [x] Make stock decrement concurrency-safe using conditional updates or transaction isolation; prevent overselling during parallel checkouts.
- [x] Add an immutable audit event actor, reason, and reference ID to stock changes.
- [x] Store historical cost at checkout and backfill existing transaction items before using profit reporting in production.
- [x] Add daily report endpoint at `/api/reports/daily?date=YYYY-MM-DD`; retain `/api/reports/monthly?month=YYYY-MM`.
- [x] Make timezone explicit in business reporting, starting with `Asia/Jakarta` configuration.

Acceptance criteria:
- Parallel checkout tests never create negative stock.
- Historical profit does not change after a product’s purchase price changes.
- API contract tests cover authorization and invalid checkout data.

Target release: v0.2.0

## M2 — Offline-first PWA POS

Goal: Allow a cashier to sell during an unreliable internet connection without silently losing data.

Deliverables:
- [x] Add web app manifest, icons, install prompt, and service worker.
- [x] Cache the application shell and read-only catalog data with versioned cache invalidation.
- [x] Store offline checkout intents in IndexedDB with a unique client-generated idempotency key.
- [x] Add server-side idempotency handling for checkout requests.
- [x] Implement sync queue states: pending, syncing, completed, failed, and conflict.
- [x] Build an operator-facing conflict screen for discontinued products, changed prices, and insufficient stock.
- [x] Add E2E tests for offline checkout queue and reconnect synchronization.

Acceptance criteria:
- A transaction created offline is processed exactly once after connectivity returns.
- Cashier sees an actionable result for every queued transaction; no transaction disappears silently.

Target release: v0.3.0

## M3 — Store accounts, roles, and auditability

Goal: Support real shop operations with controlled access and accountable actions.

Deliverables:
- [x] Add `Store` ownership to business data and migrate existing records safely.
- [x] Add roles: owner, manager, cashier.
- [x] Enforce authorization server-side for settings, price changes, stock adjustments, and transaction voids.
- [x] Replace arbitrary hard-delete transaction behavior with a void/reversal workflow and reason field.
- [x] Create append-only audit log for sign-in, checkout, adjustments, settings changes, and voids.
- [x] Add user-management UI: invite/create, deactivate, reset password, and role changes.
- [x] Add rate limiting and account-lockout/backoff policy for login.

Acceptance criteria:
- A cashier cannot alter store configuration or void another cashier’s transaction without permission.
- Every sensitive state change has actor, time, action, target, and reason where applicable.

Target release: v0.4.0

## M4 — Operational reporting and business workflows

Goal: Turn transactional data into useful, exportable business records.

Deliverables:
- [x] CSV/XLSX export for products, stock history, daily sales, and monthly sales.
- [x] Purchase/restock workflow with supplier, quantity, cost, and receipt reference.
- [x] Customer ledger for receivables (utang/piutang), payments, and balances.
- [x] Cash movement ledger for opening cash, expenses, deposits, and closing reconciliation.
- [x] Daily closing report: expected cash, recorded cash, variance, and approval.
- [x] Barcode scanner support and printable receipt layout.
- [x] Data import with validation, dry-run preview, and error report.

Acceptance criteria:
- Monthly profit, cash movement, stock value, and receivables can be exported without manual spreadsheet reconstruction.
- Imports cannot partially corrupt product or stock data.

Target release: v0.5.0

## M5 — Production hardening and OSS growth

Goal: Make Warung App dependable to deploy, maintain, and contribute to publicly.

Deliverables:
- [x] Add Docker production image, Compose deployment example, health endpoint, and non-root runtime.
- [x] Add scheduled encrypted backup and documented restore drill for MySQL.
- [x] Add structured logs, error tracking integration point, metrics, and health/readiness checks.
- [x] Add dependency update automation and regular security-audit process.
- [x] Publish versioned changelog, release tags, upgrade notes, and rollback steps.
- [x] Translate key contributor and setup documentation into Indonesian and English.
- [x] Add maintainership guide, roadmap issue labels, and good-first-issue backlog.

Acceptance criteria:
- A deployment can be restored from a verified backup.
- Every release has tested migration, upgrade, rollback, and security notes.
- A new community contributor can find and complete a well-scoped first contribution.

Target release: v1.0.0

## Explicitly deferred

- AI-assisted business advice or chat features. Add only after core accounting and offline integrity are proven.
- Payment-provider integration. Define reconciliation, failure, and dispute handling first.
- Multi-branch inventory transfers. Add after the single-store audit model is stable.
- Native mobile applications. Reassess after offline PWA usage is validated.
