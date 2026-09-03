# M4 — Operational Reporting & Business Workflows

> **For Hermes:** Execute task-by-task, verify build after each.

**Goal:** Turn transactional data into exportable business records + add restock workflow.

**Architecture:** Server-side XLSX generation via `xlsx` library, streamed as download. Restock = dedicated endpoint creating StockLog + Product stock increment in one transaction.

**Tech Stack:** xlsx (already installed), Express routes, React fetch+download

---

## Task 1: XLSX Export API — Products

Add `GET /api/export/products` that returns .xlsx with all active products.

## Task 2: XLSX Export API — Stock History

Add `GET /api/export/stock-history` with optional `?from=&to=` date filter.

## Task 3: XLSX Export API — Daily Sales

Add `GET /api/export/sales-daily?date=YYYY-MM-DD`.

## Task 4: XLSX Export API — Monthly Sales

Add `GET /api/export/sales-monthly?month=YYYY-MM`.

## Task 5: Restock API

Add `POST /api/stocks/restock` — supplier, product_id, qty, cost_per_unit, receipt_ref.

## Task 6: Frontend — Export buttons on Reports page

## Task 7: Frontend — Restock form/modal on Products page

## Task 8: Tests + build verification
