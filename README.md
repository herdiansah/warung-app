# 🏪 Warung Sales Record App

Aplikasi pencatatan penjualan warung berbasis web (PWA Ready) yang dirancang khusus untuk pemilik warung kecil atau toko kelontong. Aplikasi ini mempermudah pencatatan penjualan harian, pemantauan stok barang, dan melihat ringkasan keuntungan tanpa memerlukan kemampuan akuntansi yang rumit.

## ✨ Fitur Utama (MVP)

- **📈 Dashboard**: Menampilkan ringkasan penjualan, transaksi hari ini, produk terlaris, dan peringatan stok hampir habis.
- **📦 Manajemen Produk**: Tambah, edit, hapus, dan cari produk dengan fitur peringatan stok rendah.
- **🛒 Pencatatan Transaksi (POS)**: Fitur kasir sederhana untuk mencatat penjualan dengan kalkulasi otomatis dan pemotongan stok secara real-time.
- **📉 Manajemen Stok**: Catat masuk/keluarnya stok, penyesuaian stok manual (opname), dan pantau riwayat pergerakan barang.
- **📊 Laporan Penjualan**: Laporan harian dan bulanan otomatis yang mencakup omzet, profit, transaksi, dan item terlaris.
- **⚙️ Pengaturan**: Konfigurasi batas stok rendah (low stock threshold) sesuai keinginan pengguna.
- **🔐 Autentikasi Keamanan**: Sistem login yang aman dengan JWT (JSON Web Token) dan enkripsi password.

## 🛠️ Teknologi yang Digunakan

Aplikasi ini menggunakan stack monorepo sederhana yang menggabungkan Frontend dan Backend dalam satu project:

**Frontend:**
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS v4](https://tailwindcss.com/)
- [React Router DOM](https://reactrouter.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide React](https://lucide.dev/) (Icons)

**Backend & Database:**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma ORM](https://www.prisma.io/)
- [JWT](https://jwt.io/) & [Bcrypt.js](https://www.npmjs.com/package/bcryptjs)
- MySQL / PostgreSQL / SQLite

---

## 🚀 Panduan Menjalankan Lokal (Development)

**Prasyarat:**
- Node.js (direkomendasikan versi 18 atau terbaru)
- Database SQL (berdasarkan konfigurasi provider Prisma Anda)

### 1. Kloning Repository & Install Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env` dan sesuaikan URL database, JWT Secret, serta port:
```env
DATABASE_URL="file:./dev.db"  # Sesuaikan dengan provider database
JWT_SECRET="rahasia_aman_anda"
PORT=3000
```

### 3. Setup Database (Migrasi & Seed)
Sinkronisasikan skema Prisma ke database dan jalankan seeder:
```bash
# Push schema ORM ke DB
npx prisma db push

# (Opsional) Generate Prisma Client
npx prisma generate

# Jalankan seed data untuk mengisi akun admin (dan produk sample)
npm run prisma db seed
```

### 4. Jalankan Aplikasi Backend
Aplikasi ini menjalankan backend server melalui Express (`server.ts`). Buka terminal dan jalankan:
```bash
npm run dev
# Menjalankan TSX: server API berjalan di http://localhost:3000
```

### 5. Jalankan Aplikasi Frontend (Opsional Jika Dipisah)
*Catatan: Aplikasi ini menjalankan `tsx server.ts` yang biasanya dikonfigurasi untuk menyajikan endpoint API dan statis files, atau Vite dapat dijalankan terpisah tergantung konfigurasi Vite yang ada.*
```bash
npx vite
```

---

## 📂 Struktur Proyek

- `src/` - Berisi seluruh kode Frontend (React, Pages, Components, Store).
- `server.ts` - Berisi file utama Backend Server Express.
- `prisma/` - Berisi Schema ORM Database (`schema.prisma`) dan script seeder (`seed.ts`).
- `docs/` - Dokumentasi rinci proyek, rancangan fitur, log pengembangan, dll.

## 📝 Dokumentasi Terkait
Penjelasan lebih mendetail mengenai alur sistem dan basis data dapat dipelajari di:
- [Product Requirements Document (PRD)](./docs/PRD.md)
- [Functional Specification Document (FSD)](./docs/FSD.md)
- [Technical Specification Document (TSD)](./docs/TSD.md)
- [Daftar Task & Roadmap Proyek](./docs/TASK_LIST.md)
