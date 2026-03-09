# Product Requirements Document (PRD)

## Warung Sales Record App

## 1. Product Overview

Aplikasi ini adalah sistem sederhana untuk membantu pemilik **warung kecil / toko kelontong** mencatat penjualan harian, memonitor stok barang, dan melihat ringkasan keuntungan secara mudah tanpa perlu kemampuan akuntansi.

Target utama adalah **pemilik warung tradisional** yang biasanya masih mencatat secara manual di buku.

### Product Goals

* Mempermudah pencatatan transaksi penjualan
* Memantau stok barang
* Mengetahui omzet harian dan bulanan
* Mengurangi kesalahan pencatatan manual

---

# 2. Target Users

### Primary User

Pemilik warung kecil atau penjaga toko.

Karakteristik:

* Tidak terlalu familiar dengan software kompleks
* Menggunakan smartphone Android
* Membutuhkan sistem yang **sangat sederhana dan cepat**

---

# 3. Core Features (MVP)

## 3.1 Dashboard

Menampilkan ringkasan aktivitas penjualan.

**Informasi yang ditampilkan**

* Total penjualan hari ini
* Total transaksi hari ini
* Produk terlaris
* Stok hampir habis

---

## 3.2 Manajemen Produk

Pemilik warung dapat menambahkan daftar barang yang dijual.

### Data Produk

* Nama produk
* Kategori (opsional)
* Harga beli
* Harga jual
* Stok
* Satuan (pcs, bungkus, botol, dll)

### Fungsi

* Tambah produk
* Edit produk
* Hapus produk
* Update stok

---

## 3.3 Pencatatan Penjualan

Fitur utama untuk mencatat transaksi.

### Flow

1. Pilih produk
2. Masukkan jumlah
3. Sistem otomatis menghitung total
4. Simpan transaksi

### Data Transaksi

* Tanggal
* Produk
* Qty
* Harga jual
* Total transaksi

---

## 3.4 Riwayat Transaksi

Melihat transaksi yang sudah terjadi.

### Fitur

* List transaksi
* Filter tanggal
* Detail transaksi
* Hapus transaksi (jika salah input)

---

## 3.5 Laporan Penjualan

Melihat performa penjualan.

### Laporan yang tersedia

**Laporan Harian**

* Total penjualan
* Total transaksi
* Total keuntungan

**Laporan Bulanan**

* Total omzet
* Produk terlaris

---

## 3.6 Manajemen Stok

Sistem otomatis mengurangi stok saat transaksi terjadi.

### Fitur

* Stok masuk
* Stok keluar
* Alert stok rendah

---

# 4. User Flow

### Setup Awal

```
Install App
→ Tambah Produk
→ Mulai Catat Penjualan
```

### Catat Transaksi

```
Dashboard
→ Tambah Transaksi
→ Pilih Produk
→ Input Qty
→ Simpan
```

### Cek Laporan

```
Dashboard
→ Laporan
→ Pilih tanggal
```

---

# 5. UI/UX Principles

Aplikasi harus:

* **Super simple**
* **Minim klik**
* **Font besar**
* **Tombol besar**
* **Kontras tinggi**

Target: **transaksi bisa dicatat < 5 detik**

---

# 6. Suggested Screens

1. **Login / Setup**
2. **Dashboard**
3. **Produk**
4. **Tambah Produk**
5. **Transaksi Baru**
6. **Riwayat Transaksi**
7. **Laporan**
8. **Pengaturan**

---

# 7. Technical Architecture (Simple)

### Frontend

* React / NextJS

### Backend

* NodeJS / Express

### Database

* SQLite (offline first)

---

# 8. Database Schema (Basic)

### Table: products

| Field          | Type    |
| -------------- | ------- |
| id             | int     |
| name           | varchar |
| category       | varchar |
| purchase_price | decimal |
| selling_price  | decimal |
| stock          | int     |
| unit           | varchar |

---

### Table: transactions

| Field | Type     |
| ----- | -------- |
| id    | int      |
| date  | datetime |
| total | decimal  |

---

### Table: transaction_items

| Field          | Type    |
| -------------- | ------- |
| id             | int     |
| transaction_id | int     |
| product_id     | int     |
| qty            | int     |
| price          | decimal |
| subtotal       | decimal |

---

# 9. Non Functional Requirements

### Performance

* Transaksi harus < 1 detik

### Usability

* Bisa digunakan tanpa training

### Reliability

* Data tersimpan otomatis

---

# 10. Future Features (Phase 2)

* Scan barcode
* Cetak struk
* Multi user (kasir)
* Sync cloud
* Export Excel
* Hutang pelanggan
* Pembelian ke supplier

---

# 11. Success Metrics

* Jumlah transaksi yang dicatat
* Daily active users
* Retention rate

---