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

## [2026-09-03] TASK-M4-1/2: XLSX Export & Restock Workflow
**Role:** LD / QA
**Modules/Functions:** Reports export, Products kulakan
**Files Touched:** `server.ts`, `src/pages/Reports.tsx`, `src/pages/Products.tsx`
**Tests/Validation:** 13/13 vitest pass; lint+build pass
**Problems/Solutions:** Seed admin lacked explicit owner role after M3 RBAC → fixed seed.ts.

## [2026-09-03] TASK-M4-3a: Customer Receivables Ledger (Utang/Piutang)
**Role:** LD / FE / QA
**Modules/Functions:** Customer CRUD, credit checkout, payment recording
**Files Touched:** `prisma/schema.prisma` (Customer, CustomerPayment, Transaction.payment_method/customer_id), `server.ts`, `src/pages/Customers.tsx`, `src/pages/POS.tsx`, `src/App.tsx`, `src/components/Layout.tsx`, `tests/api/customers.test.ts`
**Tests/Validation:** 9 new API tests; 22/22 total pass
**Problems/Solutions:** Zod v4 uses `.issues` not `.errors`; authorizeRole takes an array.

## [2026-09-03] TASK-M4-3b: Cash Movement Ledger (Buku Kas)
**Role:** LD / FE / QA
**Modules/Functions:** Cash in/out, summary balance, kulakan auto-cash-out
**Files Touched:** `prisma/schema.prisma` (CashMovement), `server.ts`, `src/pages/Cash.tsx`, `tests/api/cash.test.ts`
**Tests/Validation:** 7 new API tests; 29/29 pass
**Problems/Solutions:** LSP Prisma type errors were stale cache — verified with `tsc --noEmit`.

## [2026-09-03] TASK-M4-4: Daily Cashier Closing (Tutup Kasir)
**Role:** LD / FE / QA
**Modules/Functions:** Expected cash reconciliation, upsert closing, history
**Files Touched:** `prisma/schema.prisma` (DailyClosing), `server.ts`, `src/pages/DailyClosing.tsx`, `tests/api/closings.test.ts`
**Tests/Validation:** 5 new API tests; 34/34 pass
**Problems/Solutions:** Test expected-cash went negative (kulakan > sales in test data) → top up kas in beforeAll before asserting positive actual_cash.

## [2026-09-03] TASK-M4-5/6: Barcode Scanner Support & Data Import
**Role:** LD / FE / QA
**Modules/Functions:** Barcode field + unique index, barcode lookup API, POS scan input, XLSX/CSV import with validation
**Files Touched:**
- `prisma/schema.prisma` (Product.barcode, migration `add_product_barcode`)
- `server.ts` (GET /api/products/barcode/:code, POST /api/import/products, barcode on create/update, P2002 → 400)
- `src/pages/Products.tsx` (barcode field in form, Import button + error rows panel)
- `src/pages/POS.tsx` (scan input: barcode + Enter → add to cart)
- `tests/api/barcode-import.test.ts` (8 new tests)
**Tests/Validation:** lint + build pass; 42/42 tests pass
**Problems/Solutions:**
- Duplicate `/api/products/barcode/:code` route existed (one with invalid `findUnique` + `is_active`) → removed the stale duplicate.
- Duplicate barcode create raised P2002 → caught and mapped to 400 "Barcode sudah digunakan".
- Tests used fixed barcodes, colliding with leftover DB rows across runs → unique per-run barcode prefix + afterAll cleanup.
- Import endpoint normalizes Indonesian/English headers, coerces numeric strings, upserts by barcode (or name), reports per-row errors with Excel row numbers (header = row 1).
**Follow-ups:** None. M4 complete.
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

## [2026-09-03] TASK-M3: Store accounts, roles, and auditability
**Role:** LD/FE
**Modules/Functions:** RBAC, User Management, Transaction Voids, Store ownership
**Files Touched:**
- `prisma/schema.prisma`
- `src/middlewares/authMiddleware.ts`
- `server.ts`
- `src/pages/Users.tsx`, `src/App.tsx`, `src/components/Layout.tsx`
**Tests/Validation:** 
- TypeScript (`tsc --noEmit`) and Vite build passed.
- Prisma migration `20260903003006_add_store_and_roles` successfully applied to TiDB.
**Problems/Solutions:**
- **Problem:** Hard deleting transactions corrupts historical integrity and audit trail.
- **Solution:** Replaced `DELETE /api/transactions/:id` with `POST /api/transactions/:id/void`. It restores stock, leaves a `void_reversal` log in StockLog, and marks the transaction as `void` with a `void_reason` and `voided_by` reference.
**Follow-ups:** None.
