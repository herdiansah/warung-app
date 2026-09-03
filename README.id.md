# Warung App

Warung App adalah aplikasi sumber terbuka untuk pencatatan penjualan, inventaris, dan keuntungan bagi usaha mikro-ritel Indonesia ("warung") dan toko kelontong. Dirancang untuk membuat operasional toko sehari-hari mudah diakses tanpa keahlian akuntansi.

## Fitur saat ini

- Dashboard penjualan harian, jumlah transaksi, produk terlaris, dan peringatan stok menipis.
- Manajemen produk dengan harga, stok, kategori, pencarian, dan penghapusan lunak untuk produk yang sudah terjual.
- Kasir (POS) dengan validasi harga dan stok di sisi server.
- Penyesuaian stok dan riwayat pergerakan stok yang dapat diaudit.
- Laporan penjualan bulanan dengan pendapatan, total transaksi, laba kotor, dan produk terlaris.
- Endpoint API terproteksi JWT dan hash password bcrypt.
- Dukungan barcode scanner untuk input dan lookup produk.
- Impor data massal dari XLSX/CSV dengan validasi.
- Buku kas (penerimaan/pengeluaran) dan piutang pelanggan.
- Laporan harian (tutup kasir) dengan selisih dan persetujuan.
- Ekspor CSV/XLSX untuk produk, stok, penjualan.
- Dukungan multi-peran (owner, manager, cashier) dengan otorisasi server-side.
- Catatan audit untuk perubahan sensitif.
- Pembatalan transaksi (void) dengan alasan.
- Mode offline-first PWA (sinkronisasi antrean saat koneksi kembali).

## Status

MVP yang dikelola secara aktif. Membutuhkan MySQL. Lihat [CHANGELOG.md](CHANGELOG.md) untuk riwayat rilis dan [MILESTONES.md](docs/MILESTONES.md) untuk rencana pengembangan.

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
ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='<password-unik-12-karakter>' npm run prisma -- db seed
npm run dev
```

Server pengembangan berjalan di `http://127.0.0.1:3000`.

## Pemeriksaan kualitas

```bash
npm test
npm run lint
npm run build
```

## Docker (produksi)

```bash
# Pastikan .env sudah diisi, lalu:
docker compose up -d --build
```

Lihat [DEPLOYMENT.md](docs/DEPLOYMENT.md) untuk panduan lengkap.

## Keamanan

- Jangan pernah commit `.env`, dump database, data pelanggan, atau kredensial.
- Kredensial owner awal hanya diberikan saat menjalankan seed; aplikasi tidak membuat akun default.
- Baca [SECURITY.md](SECURITY.md) untuk pelaporan kerentanan dan panduan deployment.

## Berkontribusi

Baca [CONTRIBUTING.md](CONTRIBUTING.md) sebelum membuka issue atau pull request. Partisipasi komunitas diatur oleh [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Lisensi

Warung App dirilis di bawah lisensi [MIT](LICENSE).