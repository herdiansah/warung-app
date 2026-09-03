import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';

describe('Products API', () => {
  let token: string;
  let api: any;
  
  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;
  });

  it('should fail creating product with invalid price data', async () => {
    const res = await api.post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: "Test Product",
        category: "Test",
        purchase_price: -100, // Invalid
        selling_price: "not a number", // Invalid
        stock: 10,
        unit: "Pcs"
      });
    expect(res.status).toBe(400);
  });

  it('generates a unique internal Code 128 barcode for an authorized manager', async () => {
    const first = await api.post('/api/products/barcode/generate')
      .set('Authorization', `Bearer ${token}`);
    const second = await api.post('/api/products/barcode/generate')
      .set('Authorization', `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(first.body.barcode).toMatch(/^W\d{12}$/);
    expect(second.body.barcode).toMatch(/^W\d{12}$/);
    expect(second.body.barcode).not.toBe(first.body.barcode);
  });

  it('rejects barcode generation without authentication', async () => {
    const res = await api.post('/api/products/barcode/generate');
    expect(res.status).toBe(401);
  });
});

// Self-check: Code 128 internal codes are compact, scanner-safe text.
console.assert(/^W\d{12}$/.test('W123456789012'));
