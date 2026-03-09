# Technical Specification Document (TSD)

## Warung Sales Record Application

---

# 1. System Architecture

Aplikasi dirancang **simple, cepat, dan low-cost** sehingga cocok untuk UMKM.

### Architecture Type

**Client-Server Web Application (PWA Ready)**

```text
User Device (Browser / Mobile PWA)
        │
        │ HTTPS
        │
Frontend (NextJS / React)
        │
        │ REST API
        │
Backend (NodeJS + Express)
        │
        │
Database (MySQL / PostgreSQL)
```

### Optional Infrastructure

```text
Cloudflare
     │
AWS / VPS
     │
Backend API
     │
Database Server
```

---

# 2. Technology Stack

### Frontend

| Component        | Technology              |
| ---------------- | ----------------------- |
| Framework        | NextJS                  |
| Language         | TypeScript              |
| Styling          | TailwindCSS             |
| State Management | Zustand / React Context |
| PWA              | Next PWA                |
| HTTP Client      | Axios                   |

---

### Backend

| Component      | Technology |
| -------------- | ---------- |
| Runtime        | NodeJS     |
| Framework      | ExpressJS  |
| ORM            | Prisma     |
| Authentication | JWT        |
| Validation     | Zod / Joi  |

---

### Database

| Component  | Technology         |
| ---------- | ------------------ |
| Primary DB | MySQL / PostgreSQL |
| ORM Layer  | Prisma             |

---

### Hosting (Recommended)

| Component     | Service                     |
| ------------- | --------------------------- |
| App Server    | AWS Elastic Beanstalk / VPS |
| Database      | AWS RDS                     |
| CDN           | Cloudflare                  |
| Asset Storage | AWS S3                      |

---

# 3. Application Modules

| Module         | Description          |
| -------------- | -------------------- |
| Authentication | Login user           |
| Dashboard      | Ringkasan penjualan  |
| Product        | Manajemen produk     |
| Sales          | Pencatatan transaksi |
| Inventory      | Manajemen stok       |
| Reports        | Laporan penjualan    |

---

# 4. Database Schema

## Table: users

| Field         | Type     |
| ------------- | -------- |
| id            | uuid     |
| name          | varchar  |
| email         | varchar  |
| password_hash | varchar  |
| created_at    | datetime |

---

## Table: products

| Field          | Type     |
| -------------- | -------- |
| id             | uuid     |
| name           | varchar  |
| category       | varchar  |
| purchase_price | decimal  |
| selling_price  | decimal  |
| stock          | int      |
| unit           | varchar  |
| is_active      | boolean  |
| created_at     | datetime |

---

## Table: transactions

| Field            | Type     |
| ---------------- | -------- |
| id               | uuid     |
| transaction_date | datetime |
| total_amount     | decimal  |
| created_by       | uuid     |
| created_at       | datetime |

---

## Table: transaction_items

| Field          | Type    |
| -------------- | ------- |
| id             | uuid    |
| transaction_id | uuid    |
| product_id     | uuid    |
| product_name   | varchar |
| qty            | int     |
| price          | decimal |
| subtotal       | decimal |

---

## Table: stock_logs

| Field        | Type     |
| ------------ | -------- |
| id           | uuid     |
| product_id   | uuid     |
| change_type  | varchar  |
| qty          | int      |
| stock_before | int      |
| stock_after  | int      |
| created_at   | datetime |

---

# 5. Entity Relationship Overview

```text
users
   │
   │
transactions
   │
   │
transaction_items
   │
   │
products
   │
   │
stock_logs
```

---

# 6. API Specification

Semua endpoint menggunakan **REST API** dengan format JSON.

---

# Authentication API

## Login

```
POST /api/auth/login
```

Request:

```json
{
  "email": "admin@warung.com",
  "password": "123456"
}
```

Response:

```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "Owner"
  }
}
```

---

# Product API

## Get Products

```
GET /api/products
```

Response:

```json
[
  {
    "id": "uuid",
    "name": "Indomie",
    "selling_price": 3500,
    "stock": 20
  }
]
```

---

## Create Product

```
POST /api/products
```

Request:

```json
{
  "name": "Indomie",
  "purchase_price": 2500,
  "selling_price": 3500,
  "stock": 20,
  "unit": "pcs"
}
```

---

## Update Product

```
PUT /api/products/{id}
```

---

## Delete Product

```
DELETE /api/products/{id}
```

Soft delete:

```text
is_active = false
```

---

# Transaction API

## Create Transaction

```
POST /api/transactions
```

Request:

```json
{
  "items": [
    {
      "product_id": "uuid",
      "qty": 2
    }
  ]
}
```

---

### Transaction Logic

Backend akan:

1. ambil harga produk
2. hitung subtotal
3. hitung total transaksi
4. kurangi stok

---

Example response:

```json
{
  "transaction_id": "uuid",
  "total": 7000
}
```

---

## Get Transactions

```
GET /api/transactions
```

Query parameter:

```
?date=2026-03-08
```

---

# Report API

## Daily Report

```
GET /api/reports/daily
```

Response:

```json
{
  "total_sales": 150000,
  "total_transactions": 23,
  "total_profit": 35000
}
```

---

## Monthly Report

```
GET /api/reports/monthly
```

---

# 7. Business Logic Layer

---

## Transaction Calculation

```text
subtotal = qty × selling_price
```

```text
total_transaction = sum(subtotal)
```

---

## Profit Calculation

```text
profit = selling_price - purchase_price
```

```text
total_profit = profit × qty
```

---

## Stock Update

Saat transaksi dibuat:

```text
stock = stock - qty
```

Jika:

```text
stock < 0
```

transaction ditolak.

---

# 8. Security

### Authentication

JWT Token

```
Authorization: Bearer token
```

---

### Password Storage

Password disimpan menggunakan:

```
bcrypt
```

---

### API Protection

Middleware:

```
authMiddleware
```

digunakan pada endpoint:

```
/products
/transactions
/reports
```

---

# 9. Logging

Event yang dicatat:

| Event               | Log |
| ------------------- | --- |
| Product Created     | log |
| Product Updated     | log |
| Transaction Created | log |
| Stock Changed       | log |

---

# 10. Performance Strategy

### Database Index

Tambahkan index pada:

```
transactions.transaction_date
transaction_items.product_id
products.name
```

---

### Query Optimization

Gunakan aggregation query untuk laporan.

Contoh:

```sql
SELECT SUM(total_amount)
FROM transactions
WHERE DATE(transaction_date) = CURRENT_DATE;
```

---

# 11. Backup Strategy

### Automatic Backup

* Database backup harian
* Retention: 7 hari

---

### Manual Backup

User dapat:

```
Export CSV
```

---

# 12. Monitoring

Tools yang dapat digunakan:

| Tool       | Function          |
| ---------- | ----------------- |
| Sentry     | error tracking    |
| Logtail    | log monitoring    |
| CloudWatch | server monitoring |

---

# 13. Deployment Pipeline

### CI/CD Flow

```text
GitHub
   │
GitHub Actions
   │
Build NextJS
   │
Deploy Server
```

---

# 14. Future Technical Enhancements

* Offline mode (IndexedDB)
* Barcode scanning
* Multi device sync
* Mobile app (React Native)
* Receipt printing

---