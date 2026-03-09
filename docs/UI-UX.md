# UI/UX Design Brief

## Warung Sales Record App

---

# 1. Product Overview

Aplikasi ini adalah **aplikasi pencatatan penjualan sederhana untuk pemilik warung kecil / toko kelontong**.

Tujuan utama aplikasi adalah:

* Mempermudah pencatatan penjualan
* Mengurangi pencatatan manual di buku
* Memantau stok barang
* Melihat laporan penjualan dengan cepat

Aplikasi harus **sangat mudah digunakan bahkan oleh pengguna yang tidak terbiasa dengan teknologi**.

---

# 2. Target Users

### Primary Users

Pemilik warung atau penjaga toko.

Karakteristik user:

* Usia 25–55 tahun
* Menggunakan smartphone Android
* Tidak terbiasa dengan aplikasi kompleks
* Membutuhkan proses transaksi yang **cepat dan sederhana**

---

# 3. Design Goals

Desain harus memenuhi prinsip berikut:

### 1. Simplicity

Interface harus **sesederhana mungkin**.

* Minim menu
* Minim input
* Tidak membingungkan

---

### 2. Fast Interaction

Target UX:

**Mencatat transaksi maksimal 3–5 detik**

User flow harus sangat pendek.

---

### 3. Mobile First

Aplikasi digunakan terutama pada:

* smartphone
* tablet kecil

Layout harus **mobile optimized**.

---

### 4. Large Touch Targets

Karena banyak pengguna menggunakan:

* satu tangan
* kondisi warung yang sibuk

Ukuran tombol harus:

**minimum 44px–56px**

---

### 5. High Readability

Gunakan:

* font besar
* kontras tinggi
* spacing lega

---

# 4. Design Style

### Overall Style

Modern minimal POS style.

Inspirasi:

* Square POS
* Moka POS
* Kasir Pintar

---

### Visual Characteristics

Gunakan desain:

* Clean
* Flat UI
* Minimal shadow
* Rounded corners
* Spacious layout

---

### Color Palette

Gunakan warna yang:

* bersih
* tidak terlalu banyak
* kontras tinggi

Contoh:

Primary Color
Hijau / Biru

Secondary
Abu netral

Background
Off white

---

Contoh:

Primary
`#2563EB`

Background
`#F8FAFC`

Card
`#FFFFFF`

Text
`#1F2937`

---

### Typography

Gunakan font modern yang mudah dibaca.

Contoh:

* Inter
* Poppins
* Roboto

---

Font hierarchy:

| Type    | Size    |
| ------- | ------- |
| Title   | 20–24px |
| Section | 16–18px |
| Body    | 14–16px |

---

# 5. Key UX Principles

### 1. Minimize Typing

Gunakan:

* dropdown
* quick select
* tap interface

---

### 2. Visual Product Selection

Produk ditampilkan sebagai:

* list besar
* card
* search cepat

---

### 3. Clear Feedback

Setiap aksi harus memberikan feedback:

* toast notification
* visual highlight
* loading indicator

---

### 4. Error Prevention

Contoh:

Jika stok habis:

* tampilkan label **"stok habis"**
* disable tombol tambah

---

# 6. Core Screens to Design

Designer harus membuat desain untuk layar berikut.

---

# 1. Login / Setup Screen

Fungsi:

* login sederhana
* atau PIN

Elemen:

* logo app
* input email / PIN
* tombol login

---

# 2. Dashboard

Menampilkan ringkasan.

Komponen:

* Penjualan hari ini
* Jumlah transaksi
* Produk terlaris
* Stok hampir habis

Gunakan:

**stat card layout**

---

# 3. Product List Screen

Menampilkan semua produk.

Fitur:

* search bar
* add product button
* edit product

Item produk menampilkan:

* nama
* harga jual
* stok

---

# 4. Add / Edit Product Screen

Form sederhana:

Input:

* nama produk
* harga beli
* harga jual
* stok
* satuan

Tombol:

**Simpan**

---

# 5. Transaction Screen (Most Important)

Ini adalah layar utama.

Layout harus sangat cepat digunakan.

Struktur:

```
Search Product

Product List

Selected Items

Total Price

Save Transaction Button
```

---

Produk harus bisa:

* klik tambah
* tambah qty cepat

---

# 6. Transaction History

List transaksi:

* tanggal
* total transaksi

User bisa:

* klik detail
* hapus transaksi

---

# 7. Reports Screen

Menampilkan:

* omzet harian
* jumlah transaksi
* profit

Gunakan:

* chart sederhana
* summary card

---

# 8. UX Interaction Requirements

---

### Product Selection

Tap produk:

```
+1 item
```

Tap lagi:

```
+1 qty
```

---

### Qty Adjustment

User bisa:

```
+ / -
```

---

### Save Transaction

Setelah klik:

```
Transaction Saved
```

muncul notifikasi.

---

# 9. Components to Design

Designer harus membuat reusable components:

* Button
* Input
* Product Card
* Transaction Item
* Stat Card
* Modal
* Toast Notification

---

# 10. Design System

Gunakan design system sederhana.

Komponen utama:

* spacing system (8px grid)
* button variants
* card components
* typography hierarchy

---

# 11. Deliverables

UI/UX Designer harus menghasilkan:

### 1. High Fidelity UI

Semua screen lengkap.

---

### 2. Design System

Components library.

---

### 3. Mobile Layout

Untuk:

* 360px
* 390px

---

### 4. Prototype

Clickable flow:

```
Dashboard
→ Transaction
→ Save
```

---

# 12. Success Criteria

Desain dianggap berhasil jika:

* user bisa memahami aplikasi dalam **<30 detik**
* transaksi bisa dilakukan dalam **<5 detik**
* tampilan bersih dan tidak membingungkan

---