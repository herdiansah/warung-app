# Warung App Task Tracker

## Source Documents
- Roadmap & Milestones: `docs/MILESTONES.md`
- M1 Implementation Plan: `docs/plans/M1-Integrity.md`

## Roles & Ownership
- **Lead Developer (LD):** Responsible for architecture, core logic, and backend/Prisma integrations.
- **Frontend Engineer (FE):** Responsible for React, Vite, Tailwind, and UI components.
- **QA/Reviewer (QA):** Responsible for writing tests, code review, and verifying acceptance criteria.

## Status Legend
- [ ] Pending
- [-] In Progress
- [x] Completed
- [b] Blocked (See BACK_LOG.md)

## Cross-Agent Rules
1. Every completed task MUST be marked `[x]` here.
2. Every completed task MUST append an entry to `DEV_LOG.md`.
3. Every blocked/deferred task MUST be recorded in `BACK_LOG.md`.
4. NO SECRETS (`.env`, JWT keys) shall ever be written to these logs.

---

## M0 — Local developer baseline
*Status: Completed*
- [x] TASK-M0-1: Create local `.env` setup guide & examples
- [x] TASK-M0-2: Fix Prisma seed script to use bcrypt & env vars (no default passwords)
- [x] TASK-M0-3: Validate TiDB serverless connection & SSL params
- [x] TASK-M0-4: OSS Governance files (LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT)
- [x] TASK-M0-5: GitHub Actions CI workflow

## M1 — Transaction and inventory integrity
*Status: Pending*
- [ ] TASK-M1-1: Setup API Testing Infrastructure (Supertest + Vitest)
- [ ] TASK-M1-2: Enforce input schemas for all write endpoints (return 400/401/403/404)
- [ ] TASK-M1-3: Concurrency-Safe Stock Decrement (prevent overselling)
- [ ] TASK-M1-4: Immutable Stock Audit Trail (actor, reason, reference_id in StockLog)
- [ ] TASK-M1-5: Backfill historical cost at checkout (schema changes already applied)
- [ ] TASK-M1-6: Timezone-Aware Daily & Monthly Reporting (Asia/Jakarta)

## M2 — Offline-first PWA POS
*Status: Pending*
- [ ] TASK-M2-1: Add web app manifest & service worker (cache app shell)
- [ ] TASK-M2-2: Offline checkout intents in IndexedDB (idempotency key)
- [ ] TASK-M2-3: Server-side idempotency handling
- [ ] TASK-M2-4: Sync queue states & conflict resolution screen

## M3 — Store accounts, roles, and auditability
*Status: Pending*
- [ ] TASK-M3-1: Add `Store` ownership & roles (owner, manager, cashier)
- [ ] TASK-M3-2: Server-side role authorization
- [ ] TASK-M3-3: Transaction void/reversal workflow
- [ ] TASK-M3-4: Append-only audit log for sensitive changes

## M4 — Operational reporting and business workflows
*Status: Pending*
- [ ] TASK-M4-1: CSV/XLSX exports
- [ ] TASK-M4-2: Purchase/restock workflow
- [ ] TASK-M4-3: Customer receivables ledger & cash movement ledger
- [ ] TASK-M4-4: Daily closing report

## M5 — Production hardening and OSS growth
*Status: Pending*
- [ ] TASK-M5-1: Docker production image & Compose
- [ ] TASK-M5-2: Scheduled backups & restore drill
- [ ] TASK-M5-3: Structured logs & error tracking
- [ ] TASK-M5-4: Multilingual documentation (ID/EN)
