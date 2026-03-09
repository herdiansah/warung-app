# Functional Specification Document (FSD)

## Warung Sales Record App

---

# 1. System Overview

Aplikasi ini adalah sistem pencatatan penjualan sederhana untuk warung atau toko kecil yang memungkinkan pengguna:

* Mengelola daftar produk
* Mencatat transaksi penjualan
* Mengelola stok barang
* Melihat laporan penjualan

Sistem dirancang agar:

* cepat digunakan
* sederhana
* minim input manual

---

# 2. User Roles

Saat fase MVP hanya ada **1 role**.

### Owner / Admin

Hak akses:

* Mengelola produk
* Mencatat transaksi
* Melihat laporan
* Mengedit / menghapus transaksi

---

# 3. Functional Modules

## 3.1 Dashboard Module

### Tujuan

Memberikan ringkasan kondisi penjualan.

### Data yang ditampilkan

| Item               | Deskripsi                            |
| ------------------ | ------------------------------------ |
| Penjualan Hari Ini | Total nilai transaksi hari ini       |
| Jumlah Transaksi   | Total transaksi hari ini             |
| Produk Terlaris    | Produk dengan qty tertinggi hari ini |
| Stok Hampir Habis  | Produk dengan stok < threshold       |

### Functional Rules

* Dashboard otomatis refresh saat aplikasi dibuka
* Data dihitung berdasarkan transaksi hari ini

---

# 3.2 Product Management Module

### Tujuan

Mengelola daftar produk yang dijual di warung.

### Field Produk

| Field          | Type       | Mandatory |
| -------------- | ---------- | --------- |
| product_id     | UUID / INT | Yes       |
| name           | varchar    | Yes       |
| category       | varchar    | No        |
| purchase_price | decimal    | Yes       |
| selling_price  | decimal    | Yes       |
| stock          | int        | Yes       |
| unit           | varchar    | Yes       |
| created_at     | datetime   | Yes       |

---

### Functions

#### Add Product

Input:

| Field          | Validation |
| -------------- | ---------- |
| name           | wajib      |
| purchase_price | > 0        |
| selling_price  | > 0        |
| stock          | >= 0       |

Output:

* produk tersimpan
* muncul di daftar produk

---

#### Edit Product

User dapat mengubah:

* harga
* stok
* nama
* kategori

---

#### Delete Product

Rules:

* produk **tidak boleh dihapus jika pernah ada transaksi**
* jika ingin dihapus → status **inactive**

---

# 3.3 Sales Transaction Module

Ini adalah **fungsi utama aplikasi**.

---

## Create Transaction

### Flow

User membuka halaman:

```
Tambah Transaksi
```

Langkah:

1. pilih produk
2. input qty
3. sistem menghitung subtotal
4. user klik **Simpan**

---

### Transaction Data Structure

#### Table: transactions

| Field          | Type     |
| -------------- | -------- |
| transaction_id | UUID     |
| date           | datetime |
| total_amount   | decimal  |
| created_at     | datetime |

---

#### Table: transaction_items

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| transaction_id | UUID    |
| product_id     | UUID    |
| product_name   | varchar |
| qty            | int     |
| price          | decimal |
| subtotal       | decimal |

---

### Calculation Logic

```
subtotal = qty × selling_price
```

```
transaction_total = sum(subtotal)
```

---

### Stock Deduction Logic

Saat transaksi disimpan:

```
stock = stock - qty
```

Jika:

```
stock < 0
```

maka sistem menolak transaksi.

---

# 3.4 Transaction History Module

### Tujuan

Melihat transaksi yang telah dilakukan.

---

### Data yang ditampilkan

| Field           |
| --------------- |
| Tanggal         |
| Total transaksi |
| Jumlah item     |

---

### Functions

#### View Transaction Detail

Menampilkan:

* daftar item
* qty
* subtotal

---

#### Delete Transaction

Jika transaksi dihapus:

```
stock dikembalikan
```

contoh:

```
stok sebelumnya = 10
transaksi qty = 2
stok setelah transaksi = 8
```

Jika transaksi dihapus:

```
stok kembali = 10
```

---

# 3.5 Stock Management Module

### Tujuan

Mengelola stok barang.

---

### Stock Update

User dapat melakukan:

```
Tambah Stok
```

contoh:

```
stok lama = 10
stok masuk = 5
stok baru = 15
```

---

### Low Stock Alert

Jika:

```
stock <= threshold
```

produk muncul di dashboard.

Default threshold:

```
5
```

---

# 3.6 Sales Report Module

---

## Daily Report

Menampilkan:

| Metric             |
| ------------------ |
| Total omzet        |
| Total transaksi    |
| Total item terjual |
| Profit             |

---

### Profit Calculation

```
profit = selling_price - purchase_price
```

```
total_profit = sum(profit × qty)
```

---

## Monthly Report

Menampilkan:

| Metric          |
| --------------- |
| Total omzet     |
| Total transaksi |
| Produk terlaris |
| Total profit    |

---

# 4. UI Functional Behavior

---

## Product List Screen

Fungsi:

* search produk
* edit
* tambah produk

---

## Transaction Screen

Layout:

```
Search Product
↓

Product List
↓

Selected Items
↓

TOTAL
↓

SAVE BUTTON
```

---

## Dashboard Screen

Menampilkan:

```
Penjualan Hari Ini
Total Transaksi
Produk Terlaris
Stok Rendah
```

---

# 5. Validation Rules

| Rule           | Description         |
| -------------- | ------------------- |
| qty > 0        | qty tidak boleh 0   |
| price > 0      | harga tidak boleh 0 |
| stock >= qty   | stok harus cukup    |
| name not empty | nama produk wajib   |

---

# 6. Error Handling

| Case                   | Response        |
| ---------------------- | --------------- |
| stok habis             | tampilkan alert |
| produk tidak ditemukan | tampilkan pesan |
| gagal simpan transaksi | retry           |

---

# 7. Data Backup Strategy

Untuk versi sederhana:

### Option 1 (recommended)

```
Cloud sync
```

atau

### Option 2

```
Export CSV
```

---

# 8. Performance Requirements

| Parameter        | Target   |
| ---------------- | -------- |
| Simpan transaksi | <1 detik |
| Load dashboard   | <1 detik |
| Load produk      | <1 detik |

---

# 9. Security

Untuk MVP:

* local device login
* optional PIN

---

# 10. Logging

Sistem mencatat:

| Event             |
| ----------------- |
| transaksi dibuat  |
| transaksi dihapus |
| produk ditambah   |
| stok diupdate     |

---