# Task List — Warung Sales Record App

## Ringkasan Proyek

Aplikasi pencatatan penjualan warung berbasis web (PWA Ready) menggunakan **NextJS + ExpressJS + Prisma + MySQL/PostgreSQL**. Dokumen referensi: [PRD.md](file:///f:/Documents/FlashID/Sharing/Sesi_1/docs/PRD.md), [FSD.md](file:///f:/Documents/FlashID/Sharing/Sesi_1/docs/FSD.md), [TSD.md](file:///f:/Documents/FlashID/Sharing/Sesi_1/docs/TSD.md).

---

## ⚠️ Aturan Wajib — Semua Agent

> **Setiap agent WAJIB mengupdate 2 file berikut setelah menyelesaikan setiap task:**

### 1. `docs/DEV_LOG.md` — Development Log
Catat entry baru di **paling atas** Session History:
- Nama agent & tanggal
- Task yang diselesaikan (Task ID + deskripsi)
- File yang dibuat/dimodifikasi
- Issue yang ditemui & solusinya
- Rencana sesi berikutnya

### 2. `docs/BACK_LOG.md` — Backlog
Update sesuai kondisi:
- **Pindahkan task** dari "Future Sprint" ke "Completed" jika sudah selesai
- **Tambahkan task** ke "Blocked" jika ada dependency yang belum terpenuhi
- **Tambahkan task** ke "Paused" jika task belum selesai dan perlu dilanjutkan
- **Tambahkan item** ke "Technical Debt" jika ada code improvement yang perlu dilakukan nanti
- **Tambahkan item** ke "Known Issues" jika ada bug yang ditemukan tapi belum diperbaiki

---

## Agent Roles

| Role | Emoji | Tanggung Jawab |
|------|-------|----------------|
| **🏗️ Architect Agent** | 🏗️ | Setup project, konfigurasi, struktur folder, CI/CD |
| **🗄️ Database Agent** | 🗄️ | Schema Prisma, migrasi, seed data |
| **⚙️ Backend Agent** | ⚙️ | REST API, business logic, middleware, validasi |
| **🎨 Frontend Agent** | 🎨 | UI/UX komponen, halaman, state management |
| **🔐 Security Agent** | 🔐 | Autentikasi JWT, proteksi API, hashing password |
| **✅ QA Agent** | ✅ | Testing, verifikasi, bug fixing |

---

## Phase 1: Project Setup & Infrastructure

### 1.1 — Inisialisasi Project 🏗️ Architect Agent
- [x] Setup monorepo (frontend + backend)
- [x] Inisialisasi NextJS (TypeScript + TailwindCSS)
- [x] Inisialisasi Backend (NodeJS + ExpressJS + TypeScript)
- [x] Konfigurasi Prisma ORM
- [x] Setup environment variables (`.env`)
- [ ] Setup ESLint & Prettier
- [ ] Buat `README.md` proyek

### 1.2 — Struktur Folder 🏗️ Architect Agent
- [ ] Definisikan struktur folder frontend (`/pages`, `/components`, `/lib`, `/store`)
- [ ] Definisikan struktur folder backend (`/routes`, `/controllers`, `/services`, `/middlewares`, `/validators`)

---

## Phase 2: Database

### 2.1 — Prisma Schema 🗄️ Database Agent
- [x] Model `User` (id, name, email, password_hash, created_at)
- [x] Model `Product` (id, name, category, purchase_price, selling_price, stock, unit, is_active, created_at)
- [x] Model `Transaction` (id, transaction_date, total_amount, created_by → User, created_at)
- [x] Model `TransactionItem` (id, transaction_id → Transaction, product_id → Product, product_name, qty, price, subtotal)
- [x] Model `StockLog` (id, product_id → Product, change_type, qty, stock_before, stock_after, created_at)
- [x] Setup relasi antar tabel
- [x] Tambah index: `transactions.transaction_date`, `transaction_items.product_id`, `products.name`

### 2.2 — Migrasi & Seed 🗄️ Database Agent
- [x] Jalankan initial migration
- [x] Buat seed data (user admin default, produk sample)

---

## Phase 3: Authentication

### 3.1 — Backend Auth 🔐 Security Agent
- [ ] `POST /api/auth/login` — login dengan email + password
- [ ] Implementasi JWT token generation
- [ ] Implementasi password hashing (bcrypt)
- [ ] Buat `authMiddleware` untuk proteksi endpoint
- [ ] Validasi input login (Zod)

### 3.2 — Frontend Auth 🎨 Frontend Agent
- [ ] Halaman Login (form email + password)
- [ ] Simpan token di localStorage/cookie
- [ ] Redirect logic (login → dashboard)
- [ ] Protected route wrapper

---

## Phase 4: Product Management

### 4.1 — Backend Product API ⚙️ Backend Agent
- [ ] `GET /api/products` — daftar produk (filter is_active)
- [ ] `POST /api/products` — tambah produk (validasi: name wajib, harga > 0, stok >= 0)
- [ ] `PUT /api/products/:id` — edit produk
- [ ] `DELETE /api/products/:id` — soft delete (is_active = false, tolak jika ada transaksi)
- [ ] Search produk by name

### 4.2 — Frontend Product 🎨 Frontend Agent
- [ ] Halaman Daftar Produk (list + search)
- [ ] Form Tambah Produk
- [ ] Form Edit Produk
- [ ] Konfirmasi Hapus Produk
- [ ] Tampilkan badge stok rendah

---

## Phase 5: Sales Transaction (Core Feature)

### 5.1 — Backend Transaction API ⚙️ Backend Agent
- [ ] `POST /api/transactions` — buat transaksi baru
  - Ambil harga produk dari DB
  - Hitung subtotal per item (qty × selling_price)
  - Hitung total transaksi (sum subtotal)
  - Validasi stok tersedia (tolak jika stock < qty)
  - Kurangi stok produk
  - Catat stock_log (change_type: "sale")
- [ ] `GET /api/transactions` — list transaksi (filter by date)
- [ ] `GET /api/transactions/:id` — detail transaksi + items
- [ ] `DELETE /api/transactions/:id` — hapus transaksi + kembalikan stok

### 5.2 — Frontend Transaction 🎨 Frontend Agent
- [ ] Halaman Transaksi Baru
  - Search/pilih produk
  - Input qty
  - Daftar item terpilih
  - Tampilkan total
  - Tombol Simpan (besar, kontras tinggi)
- [ ] Halaman Riwayat Transaksi
  - List transaksi (tanggal, total, jumlah item)
  - Filter tanggal
- [ ] Detail Transaksi (daftar item, qty, subtotal)
- [ ] Konfirmasi Hapus Transaksi

---

## Phase 6: Stock Management

### 6.1 — Backend Stock API ⚙️ Backend Agent
- [ ] `POST /api/products/:id/stock` — tambah stok masuk
  - Update stok produk
  - Catat stock_log (change_type: "restock")
- [ ] `GET /api/products/:id/stock-logs` — riwayat perubahan stok
- [ ] Logic low stock alert (threshold default = 5)

### 6.2 — Frontend Stock 🎨 Frontend Agent
- [ ] Form Tambah Stok
- [ ] Riwayat Perubahan Stok
- [ ] Indikator stok rendah di halaman produk

---

## Phase 7: Dashboard

### 7.1 — Backend Dashboard API ⚙️ Backend Agent
- [ ] `GET /api/dashboard` — ringkasan hari ini
  - Total penjualan hari ini
  - Total transaksi hari ini
  - Produk terlaris (qty tertinggi hari ini)
  - Daftar produk stok hampir habis (stock <= threshold)

### 7.2 — Frontend Dashboard 🎨 Frontend Agent
- [ ] Kartu Penjualan Hari Ini
- [ ] Kartu Total Transaksi
- [ ] Kartu Produk Terlaris
- [ ] Daftar Stok Hampir Habis
- [ ] Auto-refresh saat halaman dibuka
- [ ] Navigasi cepat ke Tambah Transaksi

---

## Phase 8: Laporan Penjualan

### 8.1 — Backend Report API ⚙️ Backend Agent
- [ ] `GET /api/reports/daily?date=YYYY-MM-DD`
  - Total omzet, total transaksi, total item terjual, profit
  - Profit = sum((selling_price - purchase_price) × qty)
- [ ] `GET /api/reports/monthly?month=YYYY-MM`
  - Total omzet, total transaksi, produk terlaris, total profit

### 8.2 — Frontend Report 🎨 Frontend Agent
- [ ] Halaman Laporan Harian (date picker + ringkasan)
- [ ] Halaman Laporan Bulanan (month picker + ringkasan)
- [ ] Tampilan produk terlaris

---

## Phase 9: UI/UX Polish

### 9.1 — Global UI 🎨 Frontend Agent
- [ ] Bottom navigation (Dashboard, Transaksi, Produk, Laporan, Pengaturan)
- [ ] Responsive layout (mobile first)
- [ ] Font besar, tombol besar, kontras tinggi
- [ ] Loading states & skeleton screens
- [ ] Toast/snackbar notifikasi sukses/error
- [ ] Empty state untuk list kosong

### 9.2 — Halaman Pengaturan 🎨 Frontend Agent
- [ ] Info profil user
- [ ] Ubah threshold stok rendah
- [ ] Export CSV (future, opsional)

---

## Phase 10: Logging & Error Handling

### 10.1 — Backend Logging ⚙️ Backend Agent
- [ ] Log event: product created, product updated, transaction created, stock changed
- [ ] Global error handler middleware
- [ ] Validasi error response format (JSON)

### 10.2 — Frontend Error Handling 🎨 Frontend Agent
- [ ] Alert stok habis saat transaksi
- [ ] Pesan produk tidak ditemukan
- [ ] Retry mechanism untuk gagal simpan

---

## Phase 11: Testing & QA

### 11.1 — Backend Testing ✅ QA Agent
- [ ] Unit test: business logic (kalkulasi subtotal, profit, stok)
- [ ] Integration test: API endpoints (product CRUD, transaction flow)
- [ ] Test validasi input
- [ ] Test stock deduction & restoration

### 11.2 — Frontend Testing ✅ QA Agent
- [ ] Component testing (form validasi, list rendering)
- [ ] E2E test: flow transaksi lengkap
- [ ] E2E test: CRUD produk
- [ ] Responsiveness check (mobile viewport)

---

## Phase 12: Deployment

### 12.1 — Deployment Setup 🏗️ Architect Agent
- [ ] Konfigurasi production build (NextJS + Express)
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Konfigurasi database production
- [ ] Setup backup strategy (daily backup, 7 hari retention)

---

## Ringkasan Prioritas Pengerjaan

| Prioritas | Phase | Keterangan |
|-----------|-------|------------|
| 🔴 P0 | Phase 1–3 | Fondasi: setup, database, auth |
| 🟠 P1 | Phase 4–5 | Core: produk + transaksi |
| 🟡 P2 | Phase 6–7 | Stok + dashboard |
| 🟢 P3 | Phase 8–9 | Laporan + UI polish |
| 🔵 P4 | Phase 10–12 | Logging, testing, deployment |

---

> **Catatan**: 
> 1. Setiap task harus di-review dan di-test sebelum melanjutkan ke phase berikutnya. Agent `✅ QA Agent` melakukan verifikasi di setiap akhir phase.
> 2. **WAJIB**: Semua agent harus mengupdate `DEV_LOG.md` dan `BACK_LOG.md` setelah menyelesaikan setiap task. Tidak ada pengecualian.
