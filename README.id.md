# Warung App

Warung App adalah aplikasi sumber terbuka untuk pencatatan penjualan, inventaris, dan keuntungan bagi usaha mikro-ritel Indonesia ("warung") dan toko kelontong. Dirancang untuk membuat operasional toko sehari-hari mudah diakses tanpa keahlian akuntansi.

Baca versi bahasa Inggris di [README.md](README.md).

## Fitur saat ini

- Dashboard penjualan harian, jumlah transaksi, produk terlaris, dan peringatan stok menipis.
- Manajemen produk dengan harga, stok, kategori, pencarian, penghapusan lunak untuk produk yang sudah terjual, dan impor massal dari XLSX/CSV.
- Kasir (POS) dengan validasi harga dan stok di sisi server, plus dukungan barcode scanner.
- Offline-first PWA: transaksi checkout antre di IndexedDB dan disinkronkan dengan idempotency key saat koneksi kembali.
- Penyesuaian stok dan riwayat pergerakan stok yang dapat diaudit.
- Laporan penjualan bulanan dengan pendapatan, total transaksi, laba kotor, dan produk terlaris.
- Laporan harian (tutup kasir) dengan selisih dan persetujuan.
- Alur pembelian/restock dengan pencatatan kas keluar otomatis saat kulakan.
- Buku kas (penerimaan/pengeluaran) dan piutang pelanggan.
- Pembatalan transaksi (void) dengan alasan yang tercatat.
- Dukungan multi-peran (owner, manager, cashier) dengan otorisasi server-side dan catatan audit.
- Ekspor CSV/XLSX untuk produk, stok, penjualan, dan laporan.
- Endpoint API terproteksi JWT dan hash password bcrypt.
- Endpoint kesehatan: liveness (`/api/health`) dan readiness (`/api/health/ready`).
- Logging terstruktur dengan filter `LOG_LEVEL`, output JSON, dan integrasi webhook error-tracking.

## Status

Dikelola secara aktif. Versi 1.0.0. Membutuhkan MySQL (kompatibel dengan TiDB Serverless). Lihat [CHANGELOG.md](CHANGELOG.md) untuk riwayat rilis dan [MILESTONES.md](docs/MILESTONES.md) untuk rencana pengembangan.

## Tumpukan teknologi

- Frontend: React 19, Vite, Tailwind CSS, React Router.
- Backend: Node.js, Express, TypeScript.
- Data: MySQL dan Prisma ORM.

## Mulai cepat

Prasyarat: Node.js 22+, MySQL 8+, dan npm.

```bash
git clone https://github.com/herdiansah/warung-app.git
cd warung-app
npm ci
cp .env.example .env
```

Edit `.env` dengan string koneksi MySQL dan `JWT_SECRET` unik minimal 32 karakter. Server default ke `127.0.0.1:3000`; tempatkan di belakang reverse proxy jika perlu akses publik.

Jalankan migrasi, buat akun owner pertama, dan mulai mode pengembangan:

```bash
npx prisma migrate dev
ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='use-a-unique-12-plus-character-password' npx prisma db seed
npm run dev
```

Server pengembangan berjalan di `http://127.0.0.1:3000`.

## Pemeriksaan kualitas

```bash
npm test         # API integration tests (Vitest)
npm run test:e2e # Playwright E2E smoke tests
npm run lint
npm run build
```

## Deployment produksi

Warung App menyediakan Docker image produksi (multi-stage build, runtime non-root, HEALTHCHECK) dan contoh `docker-compose.yml`:

```bash
# Isi .env dulu, lalu:
docker compose up -d --build
```

Untuk deployment bare-metal, backup, drill restore, upgrade, dan rollback, lihat [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Logging

| Variabel | Default | Deskripsi |
|----------|---------|-----------|
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `pretty` | `pretty` (console berwarna + `logs/app.log`) atau `json` (stdout, siap collector) |
| `ERROR_WEBHOOK_URL` | (kosong) | Mengirim setiap log level error sebagai JSON ke URL ini (mis. ingest Sentry-compatible, Slack webhook) |

## Backup

Jalankan `scripts/backup.sh` secara manual, via cron, atau di Docker untuk menghasilkan dump MySQL terkompresi gzip (opsional terenkripsi age) dengan retensi; `scripts/restore.sh` untuk memulihkannya. Drill lengkap di [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Keamanan

- Jangan pernah commit `.env`, dump database, data pelanggan, atau kredensial.
- Kredensial owner awal hanya diberikan saat menjalankan seed; aplikasi tidak membuat akun default.
- Baca [SECURITY.md](SECURITY.md) untuk pelaporan kerentanan dan panduan deployment.

## Berkontribusi

Baca [CONTRIBUTING.md](CONTRIBUTING.md) sebelum membuka issue atau pull request. Maintainer: lihat [MAINTAINERS.md](docs/MAINTAINERS.md). Partisipasi komunitas diatur oleh [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Lisensi

Warung App dirilis di bawah lisensi [MIT](LICENSE).
