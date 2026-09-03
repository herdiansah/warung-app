import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';

describe('Cash Ledger API', () => {
  let token: string;
  let api: any;
  let productId: string;

  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;

    const prod = await api.post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Cash Test Item", category: "Test", purchase_price: 1000, selling_price: 2000, stock: 10, unit: "Pcs" });
    productId = prod.body.id;
  });

  it('should record a cash movement', async () => {
    const res = await api.post('/api/cash')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: "out", category: "listrik", amount: 150000, note: "Listrik bulan ini" });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBeDefined();
  });

  it('should reject invalid category', async () => {
    const res = await api.post('/api/cash')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: "out", category: "judi", amount: 50000 });
    expect(res.status).toBe(400);
  });

  it('should reject non-positive amount', async () => {
    const res = await api.post('/api/cash')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: "out", category: "listrik", amount: -100 });
    expect(res.status).toBe(400);
  });

  it('should list movements', async () => {
    const res = await api.get('/api/cash')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should return summary with balance math', async () => {
    const res = await api.get('/api/cash/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sales_cash");
    expect(res.body).toHaveProperty("payments_in");
    expect(res.body).toHaveProperty("cash_in");
    expect(res.body).toHaveProperty("cash_out");
    expect(res.body.balance).toBe(
      res.body.sales_cash + res.body.payments_in + res.body.cash_in - res.body.cash_out
    );
  });

  it('should auto-record cash out on restock with cost', async () => {
    const before = await api.get('/api/cash/summary').set('Authorization', `Bearer ${token}`);
    const outBefore = before.body.cash_out;

    const res = await api.post('/api/stocks/restock')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, qty: 5, cost_per_unit: 1200, supplier: "Pasar Induk" });
    expect(res.status).toBe(200);

    const after = await api.get('/api/cash/summary').set('Authorization', `Bearer ${token}`);
    expect(after.body.cash_out).toBe(outBefore + 6000); // 5 x 1200
  });

  it('should delete a movement', async () => {
    const created = await api.post('/api/cash')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: "in", category: "modal", amount: 10000 });
    const del = await api.delete(`/api/cash/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });
});
