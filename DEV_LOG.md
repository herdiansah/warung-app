# Development Log

## Rules
- Append a new entry using the template below every time a task is completed.
- Do not log sensitive data (passwords, tokens, database credentials).
- Keep entries concise and focused on technical changes and verifications.

---

### Template
```markdown
## [YYYY-MM-DD] TASK-[ID]: [Brief Description]
**Role:** [LD / FE / QA]
**Modules/Functions:** [e.g., Auth, Checkout]
**Files Touched:**
- `path/to/file1`
- `path/to/file2`
**Tests/Validation:** [How it was verified]
**Problems/Solutions:** [Any tricky bugs and how they were fixed]
**Follow-ups:** [Any minor technical debt left behind]
```

---

## [2026-09-02] TASK-M0: OSS Readiness & DB Setup
**Role:** LD / QA
**Modules/Functions:** Database config, Environment, Auth Security, CI
**Files Touched:**
- `prisma/seed.ts`
- `server.ts`
- `src/middlewares/authMiddleware.ts`
- `.env.example`
- `.github/workflows/ci.yml`
- `docs/MILESTONES.md`
**Tests/Validation:** 
- Verified `npx prisma migrate status` against TiDB Serverless.
- Verified manual local API tests (Auth, CRUD Product, Transaction checkout).
- E2E passed.
**Problems/Solutions:**
- **Problem:** TiDB Serverless requires TLS, but Prisma failed with standard URI params.
- **Solution:** Replaced MongoDB-style `?ssl={"rejectUnauthorized":true}` with Prisma MySQL-style `?sslaccept=accept_invalid_certs`.
- **Problem:** `Setting` table missing from `schema.prisma` causing seed to fail.
- **Solution:** Removed arbitrary `Setting` upsert from `seed.ts`.
**Follow-ups:** None. Proceeding to M1.

## [2026-09-02] TASK-M1: Transaction & Inventory Integrity
**Role:** LD
**Modules/Functions:** API Testing, Validation, Checkout Concurrency, Audit Log, Reporting
**Files Touched:**
- `server.ts`
- `prisma/schema.prisma`
- `package.json`
- `tests/api/*.test.ts`
**Tests/Validation:** 
- Configured `supertest` + `vitest` with wrapper for Express.
- Tests written and passed for: Login auth, Product validation, Checkout concurrent requests (overselling prevention), and TZ-aware Daily/Monthly reports.
- TypeScript `tsc --noEmit` and Vite build passed.
**Problems/Solutions:**
- **Problem:** Concurrent checkout requests could oversell stock.
- **Solution:** Replaced generic `findUnique` -> `update` with atomic `updateMany({ where: { stock: { gte: qty } }, data: { stock: { decrement: qty } } })`.
- **Problem:** Date filters for reports defaulted to UTC causing wrong end-of-day offsets.
- **Solution:** Integrated `date-fns-tz` forcing bounds to `Asia/Jakarta` explicitly.
**Follow-ups:** None. Proceeding to M2.

## [2026-09-02] TASK-M2: Offline-first PWA POS
**Role:** LD/FE
**Modules/Functions:** Offline Queue, PWA Manifest, Idempotent Checkout
**Files Touched:**
- `vite.config.ts`, `index.html`, `src/main.tsx`
- `src/utils/offlineQueue.ts` (IndexedDB)
- `src/components/SyncManager.tsx`
- `src/pages/POS.tsx`
- `server.ts`, `prisma/schema.prisma`
**Tests/Validation:** 
- E2E API tests added for Idempotency API (`tests/api/idempotency.test.ts`). Duplicate POSTs with same key only process once.
- Frontend build successfully generates `sw.js` and Workbox.
**Problems/Solutions:**
- **Problem:** Transactions failing due to network throw standard TypeErrors.
- **Solution:** Caught `TypeError` and `Failed to fetch`, generating a random UUID `idempotency_key` beforehand, and caching the intent to IndexedDB outbox.
- **Problem:** Prisma interactive migration failed in headless mode when adding unique `idempotency_key`.
- **Solution:** Piped `yes ''` to bypass the warning.
**Follow-ups:** None.
