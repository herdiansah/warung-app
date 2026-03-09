Berikut **UX Wireframe lengkap** untuk aplikasi **Pencatatan Penjualan Warung**. Wireframe ini dibuat **low-fidelity** agar mudah dipahami oleh developer maupun UI designer sebelum masuk ke desain visual (Figma / UI High Fidelity).

Pendekatan UX yang digunakan:

* **Mobile-first**
* **POS-style interaction**
* **Minimal tap**
* **Large touch targets**

Target utama: **mencatat transaksi < 5 detik**.

---

# 1. App Structure (Navigation)

Struktur navigasi aplikasi dibuat sederhana.

```
Dashboard
Products
Transaction
History
Reports
Settings
```

Bottom navigation:

```
[Home] [Products] [Sell] [History] [Reports]
```

---

# 2. Login Screen

### Tujuan

Login sederhana agar aplikasi aman.

### Wireframe

```
--------------------------------
           LOGO

      Warung Sales App

      Email
      [____________]

      Password
      [____________]

      [ LOGIN ]

      Forgot Password
--------------------------------
```

Alternatif sederhana:

```
--------------------------------
          Warung App

        Enter PIN

        [  _ _ _ _  ]

          [LOGIN]
--------------------------------
```

---

# 3. Dashboard Screen

### Tujuan

Memberikan ringkasan kondisi warung.

### Wireframe

```
--------------------------------
Good Morning, Owner

TODAY SUMMARY

[ Sales Today ]
Rp 450.000

[ Transactions ]
23

[ Profit Today ]
Rp 90.000

--------------------------------

LOW STOCK

Indomie            3 pcs
Teh Botol          4 pcs
Gula               2 pcs

--------------------------------

TOP PRODUCTS

1. Indomie
2. Kopi Sachet
3. Teh Botol
--------------------------------
```

---

# 4. Product List Screen

### Tujuan

Mengelola produk.

### Wireframe

```
--------------------------------
Products

[ Search product... ]

--------------------------------

Indomie Goreng
Stock: 25
Price: Rp3500

[Edit]

--------------------------------

Teh Botol
Stock: 10
Price: Rp5000

[Edit]

--------------------------------

Kopi Sachet
Stock: 40
Price: Rp2000

--------------------------------

        [+ Add Product]
--------------------------------
```

---

# 5. Add / Edit Product Screen

### Tujuan

Menambahkan produk baru.

### Wireframe

```
--------------------------------
Add Product

Product Name
[________________]

Category
[________________]

Purchase Price
[________________]

Selling Price
[________________]

Stock
[________________]

Unit
[ pcs / pack / bottle ]

--------------------------------

[ SAVE PRODUCT ]
--------------------------------
```

---

# 6. Transaction Screen (Core Screen)

Ini adalah **screen paling penting**.

Tujuan: transaksi **super cepat**.

### Wireframe POS Style

```
--------------------------------
Search Product
[______________]

--------------------------------

PRODUCT LIST

Indomie           Rp3500   [+]
Teh Botol         Rp5000   [+]
Kopi Sachet       Rp2000   [+]

--------------------------------

SELECTED ITEMS

Indomie
[-] 2 [+]     Rp7000

Teh Botol
[-] 1 [+]     Rp5000

--------------------------------

TOTAL

Rp 12.000

--------------------------------

[ SAVE TRANSACTION ]
--------------------------------
```

UX rule:

Tap product:

```
qty +1
```

---

# 7. Transaction Success Screen

Feedback penting agar user yakin transaksi berhasil.

```
--------------------------------
      ✓ Transaction Saved

Total
Rp 12.000

--------------------------------

[ New Transaction ]

[ View History ]
--------------------------------
```

---

# 8. Transaction History Screen

Menampilkan transaksi sebelumnya.

### Wireframe

```
--------------------------------
Transaction History

[ Filter Date ]

--------------------------------

12 Mar 2026
Total: Rp45.000
Items: 6

[ View Detail ]

--------------------------------

12 Mar 2026
Total: Rp32.000
Items: 4

--------------------------------

11 Mar 2026
Total: Rp60.000
Items: 7

--------------------------------
```

---

# 9. Transaction Detail Screen

```
--------------------------------
Transaction Detail

Date
12 Mar 2026
10:30

--------------------------------

Indomie
2 x 3500
Rp7000

Teh Botol
1 x 5000
Rp5000

--------------------------------

TOTAL

Rp12.000

--------------------------------

[ Delete Transaction ]
--------------------------------
```

---

# 10. Reports Screen

### Tujuan

Melihat performa penjualan.

### Wireframe

```
--------------------------------
Reports

[ Daily | Monthly ]

--------------------------------

Total Sales

Rp 1.250.000

--------------------------------

Total Transactions

65

--------------------------------

Profit

Rp 250.000

--------------------------------

TOP PRODUCTS

1. Indomie
2. Kopi Sachet
3. Teh Botol
--------------------------------
```

---

# 11. Stock Management Screen

```
--------------------------------
Stock Management

Indomie
Stock: 25

[ + Add Stock ]

--------------------------------

Teh Botol
Stock: 10

[ + Add Stock ]

--------------------------------
```

---

# 12. Add Stock Screen

```
--------------------------------
Add Stock

Product
Indomie

Stock In
[________]

--------------------------------

[ SAVE ]
--------------------------------
```

---

# 13. Settings Screen

```
--------------------------------
Settings

Store Name
Warung Maju Jaya

--------------------------------

Export Data

[ Export CSV ]

--------------------------------

Backup

[ Backup Now ]

--------------------------------

Logout
--------------------------------
```

---

# 14. UX Flow Diagram

### Flow transaksi utama

```
Dashboard
   ↓
Transaction Screen
   ↓
Select Product
   ↓
Adjust Qty
   ↓
Save Transaction
   ↓
Success
```

---

# 15. UX Optimization Rules

Untuk memastikan UX **super cepat**:

### Rule 1

Produk paling sering dibeli tampil di atas.

---

### Rule 2

Produk bisa dicari dengan:

```
search
```

---

### Rule 3

Tap product = tambah qty.

---

### Rule 4

Auto clear cart setelah transaksi selesai.

---

# 16. Estimated Screens

Total screen:

```
1 Login
2 Dashboard
3 Products
4 Add Product
5 Transaction
6 Transaction Success
7 History
8 Transaction Detail
9 Reports
10 Stock
11 Add Stock
12 Settings
```

Total: **12 screens**

---
