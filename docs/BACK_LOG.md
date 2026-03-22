# Backlog - Warung Sales Record App
## Incomplete & Future Tasks

**Project:** Warung Sales Record App
**File:** BACK_LOG.md
**Last Updated:** 2026-03-22

---

## 📋 How to Use This File

**Purpose:** Track tasks that are:
1. Not yet started
2. Partially completed and paused
3. Blocked by dependencies
4. Moved to future sprints
5. Ideas for future enhancements

**When to update:**
- Move tasks from TASK.md here if delayed
- Add new ideas that come up during development
- Mark tasks as completed when done (move to DEV_LOG.md)

---

## 🚧 Blocked Tasks

*[Tasks that cannot proceed due to dependencies or issues]*

| Task ID | Description | Blocked By | Priority | Notes |
|---------|-------------|------------|----------|-------|
| QW-08 | Activate `transaction_number` auto-increment in DB | MySQL server not running in dev env | Medium | Schema change ready in `prisma/schema.prisma`; run `prisma db push` on live DB to activate |

---

## ⏸️ Paused Tasks

*[Tasks that were started but paused]*

| Task ID | Description | Status | Last Worked On | Resume Condition |
|---------|-------------|--------|----------------|------------------|
| | | | | |

---

## 📅 Future Sprint Tasks

*[Tasks planned for future sprints — sourced from docs/APP_REVIEW.md]*

### Tier 1 — High Priority

| Task ID | Description | Effort | Notes |
|---------|-------------|--------|-------|
| F-01 | Multi-user roles (Owner / Cashier) | Medium | Add `role` field to User model; role-based API guards; Users management page |
| F-02 | Multiple payment methods (QRIS, Transfer, E-wallet, Cash) | Low | Add `payment_method` + `cash_received` + `change_amount` to Transaction model |
| F-03 | Customer debt tracking (Hutang Pelanggan) | High | New `Customer` model; CREDIT payment method; debt repayment flow; customer page |
| F-04 | Receipt generation & printing | Low | Post-checkout receipt view; `window.print()` with 58/80mm thermal stylesheet; WhatsApp share |
| F-05 | Barcode scanning support | Low | Add `barcode` field to Product; USB scanner input on POS; search by barcode |

### Tier 2 — Medium Priority

| Task ID | Description | Effort | Notes |
|---------|-------------|--------|-------|
| F-06 | Supplier & Purchase Order management | High | New Supplier + PurchaseOrder models; auto stock update on receipt |
| F-07 | Discount & promotion system | Medium | `discount_percent` / `discount_amount` on TransactionItem and Transaction |
| F-08 | Charts & visual analytics | Medium | Integrate Recharts; 7-day sparkline on Dashboard; bar/pie/line on Reports page |
| F-09 | Data export (CSV / PDF) | Low | Export buttons on Reports, History, Products pages |
| F-10 | Product category management (normalized) | Low | Category table with color; chip filter row on POS |
| F-11 | Notifications & alerts | Medium | Browser push / WhatsApp / email for low stock and daily summary |

### Tier 3 — Lower Priority

| Task ID | Description | Effort | Notes |
|---------|-------------|--------|-------|
| F-12 | PWA / offline support | High | `vite-plugin-pwa`; IndexedDB cache with Dexie.js; sync queue |
| F-13 | Product images | Medium | `image_url` field; upload on product form; display in POS grid |
| F-14 | Shift management | High | Shift model; opening/closing balance; per-cashier report |
| F-15 | Security hardening | Medium | Rate limiting on `/api/auth/login`; Zod validation; refresh tokens |
| F-16 | Multi-store / branch support | High | Store model; per-store data isolation; consolidated owner reports |
| F-17 | Dark mode | Low | TailwindCSS v4 dark variants; toggle in Settings; localStorage persistence |

---

## 🔧 Technical Debt

*[Code improvements needed but not urgent]*

| Item | Description | Impact | Effort | Priority |
|------|-------------|--------|--------|----------|
| TD-01 | Replace raw `fetch()` calls with a centralized API client | Reduces boilerplate; easier auth header management | Medium | Low |
| TD-02 | Add Zod / express-validator for server-side request validation | Prevents invalid data entering DB | Medium | Medium |
| TD-03 | JWT refresh token mechanism (currently 7-day single token in localStorage) | Security improvement | Medium | Medium |
| TD-04 | Add rate limiting on `POST /api/auth/login` | Prevents brute-force attacks | Low | Medium |
| TD-05 | Normalize product categories to a dedicated table | Enables category management UI and filtering | Medium | Low |
| TD-06 | Replace hardcoded `stock <= 5` checks in POS.tsx with dynamic threshold | Consistency with settings | Low | Low |

---

## 🐛 Known Issues

*[Bugs that are documented but not yet fixed]*

| Issue ID | Description | Severity | Workaround | Planned Fix |
|----------|-------------|----------|------------|-------------|
| | | | | |

---

## 📝 Requirements Pending Clarification

*[Client requirements that need more details]*

| Req ID | Description | Questions | Status |
|--------|-------------|-----------|--------|
| | | | |

---

## ✅ Completed Tasks (From Backlog)

*[Tasks that were in backlog but have been completed]*
- [x] Phase 1.1: Buat README.md proyek
- [x] Phase 1.1: Database env implementation
- [x] Phase 2.1: Prisma Schema implementation
- [x] Phase 2.2: Initial Migration dan Seed data
- [x] Phase 3.1: Backend Login API (JWT & bcrypt)
- [x] Phase 3.2: Frontend Login page & Auth Guard `ProtectedRoute`
- [x] Phase 4.1: Backend Product API & Auth Validation
- [x] Phase 4.2: Frontend Product Page (CRUD + Badge + Search)
- [x] Phase 5.1: Backend Transaction API (Subtotal Calc, Stock Calc, Soft Delete & Validation)
- [x] Phase 5.2: Frontend Transaction Page (POS & History Mapping)
- [x] Phase 6.1: Backend Stock API (Adjust & History Logic)
- [x] Phase 6.2: Frontend Stock Management (Stok History Tab & Quick Adjust Plus Minus)
- [x] Phase 7.1: Backend Dashboard API (Ringkasan hari ini, JWT protected)
- [x] Phase 7.2: Frontend Dashboard (Widget metrics terintegrasi)
- [x] Phase 8.1: Backend Reports API (Query keuntungan bulanan)
- [x] Phase 8.2: Frontend Reports (Laporan filter dinamis by YYYY-MM)
- [x] Phase 10.1: Backend Logging (logger.error di semua catch, global error handler, JSON error format)
- [x] Phase 10.2: Frontend Error Handling (alert stok habis, empty state produk, retry mechanism di POS)
- [x] QW-01: Change calculation on POS (uang diterima + kembalian)
- [x] QW-02: Keyboard shortcut "/" to focus POS search
- [x] QW-03: Low-stock count badge on sidebar "Produk" nav item
- [x] QW-04: Empty state improvements in POS and Products pages
- [x] QW-05: Confirm on page leave when POS cart has items
- [x] QW-06: Store name configuration in Settings (shown in sidebar)
- [x] QW-07: Print stylesheet (@media print) for clean data printing
- [x] QW-08: Transaction number display TRX-NNNN in History (schema ready, DB push pending)
- [x] QW-09: 3-tier stock color coding (red/amber/green) based on low_stock_threshold
- [x] QW-10: Last synced timestamp on Dashboard with click-to-refresh
- [x] Review: Full app review in docs/APP_REVIEW.md with 17 feature recommendations

---

## 📊 Backlog Statistics

| Category | Count |
|----------|-------|
| Blocked tasks | 1 |
| Future sprint tasks (Tier 1) | 5 |
| Future sprint tasks (Tier 2) | 6 |
| Future sprint tasks (Tier 3) | 6 |
| Technical debt items | 6 |
| Completed tasks | 29 |

---

## 🔄 Movement Log

*[Track tasks moved between files]*

| Date | Task ID | From | To | Notes |
|------|---------|------|----|-------|
| 2026-03-22 | QW-01 to QW-10 | New (Quick Wins) | Completed | Implemented in Session 14 |
| 2026-03-22 | F-01 to F-17 | New (APP_REVIEW.md) | Future Sprint | Feature roadmap from full app review |
| 2026-03-22 | TD-01 to TD-06 | New | Technical Debt | Identified during Session 14 code review |

---

*This backlog is maintained by AI development agents. Review and update regularly.*
