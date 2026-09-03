import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getApp } from './setup';

// Use a unique prefix per run so leftover data from previous runs doesn't affect tests
const TS = Date.now();
const B1 = `${TS}01`;
const B2 = `${TS}02`;
const B3 = `${TS}03`;
const B4 = `${TS}04`;

describe('Barcode & Import API', () => {
  let token: string;
  let api: any;
  let createdId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;
  });

  afterAll(async () => {
    // Clean up created products
    for (const id of createdIds) {
      try {
        await api.delete(`/api/products/${id}`).set('Authorization', `Bearer ${token}`);
      } catch { /* ignore */ }
    }
  });

  it('should create product with barcode', async () => {
    const res = await api.post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: "Produk Barcode Test",
        barcode: B1,
        category: "Test",
        purchase_price: 5000,
        selling_price: 7000,
        stock: 10,
        unit: "pcs"
      });
    expect(res.status).toBe(200);
    createdId = res.body.id;
    createdIds.push(res.body.id);
  });

  it('should find product by barcode', async () => {
    const res = await api.get(`/api/products/barcode/${B1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Produk Barcode Test");
  });

  it('should 404 for unknown barcode', async () => {
    const res = await api.get('/api/products/barcode/NONEXISTENT999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should reject duplicate barcode with 400', async () => {
    const res = await api.post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: "Produk Duplikat",
        barcode: B1,
        purchase_price: 1000,
        selling_price: 1500,
        stock: 5,
        unit: "pcs"
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/barcode/i);
  });

  it('should import products from rows', async () => {
    const res = await api.post('/api/import/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rows: [
          { name: "Import Satu", barcode: B2, category: "Import", purchase_price: 1000, selling_price: 2000, stock: 3, unit: "pcs" },
          { name: "Import Dua", barcode: B3, category: "Import", purchase_price: 2000, selling_price: 3000, stock: 4, unit: "pcs" }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(2);
    expect(res.body.updated).toBe(0);
    expect(res.body.skipped).toBe(0);
  });

  it('should report row errors without failing whole import', async () => {
    const res = await api.post('/api/import/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rows: [
          { name: "Import Valid", barcode: B4, category: "Import", purchase_price: 1000, selling_price: 2000, stock: 3, unit: "pcs" },
          { name: "", barcode: "444", purchase_price: 1000, selling_price: 2000, stock: 3, unit: "pcs" }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].row).toBe(3);
  });

  it('should update existing product by barcode on import', async () => {
    const res = await api.post('/api/import/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rows: [
          { name: "Import Satu Updated", barcode: B2, category: "Import", purchase_price: 1500, selling_price: 2500, stock: 10, unit: "pcs" }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(1);

    const find = await api.get(`/api/products/barcode/${B2}`)
      .set('Authorization', `Bearer ${token}`);
    expect(find.status).toBe(200);
    expect(find.body.name).toBe("Import Satu Updated");
  });

  it('should require auth for import', async () => {
    const res = await api.post('/api/import/products').send({ rows: [] });
    expect(res.status).toBe(401);
  });
});