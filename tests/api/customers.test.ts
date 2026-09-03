import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';

describe('Customer Ledger API', () => {
  let token: string;
  let api: any;
  let customerId: string;
  let productId: string;

  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;

    const prod = await api.post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Ledger Test Item", category: "Test", purchase_price: 1000, selling_price: 2000, stock: 50, unit: "Pcs" });
    productId = prod.body.id;
  });

  it('should create a customer', async () => {
    const res = await api.post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Budi Utang", phone: "0812345678", address: "Jl. Test 1" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Budi Utang");
    customerId = res.body.id;
  });

  it('should reject customer without name', async () => {
    const res = await api.post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: "0812345678" });
    expect(res.status).toBe(400);
  });

  it('should reject credit transaction without customer', async () => {
    const res = await api.post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product_id: productId, qty: 1 }],
        payment_method: "credit",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("pelanggan");
  });

  it('should create credit transaction for a customer', async () => {
    const res = await api.post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product_id: productId, qty: 2 }],
        payment_method: "credit",
        customer_id: customerId,
      });
    expect(res.status).toBe(200);
  });

  it('should show outstanding balance in customer list', async () => {
    const res = await api.get('/api/customers')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const budi = res.body.find((c: any) => c.id === customerId);
    expect(budi).toBeDefined();
    expect(budi.balance).toBeGreaterThanOrEqual(4000);
  });

  it('should record a payment and reduce balance', async () => {
    const before = await api.get('/api/customers').set('Authorization', `Bearer ${token}`);
    const balBefore = before.body.find((c: any) => c.id === customerId).balance;

    const pay = await api.post(`/api/customers/${customerId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1500, note: "Cicilan pertama" });
    expect(pay.status).toBe(200);

    const after = await api.get('/api/customers').set('Authorization', `Bearer ${token}`);
    const balAfter = after.body.find((c: any) => c.id === customerId).balance;
    expect(balAfter).toBe(balBefore - 1500);
  });

  it('should reject non-positive payment', async () => {
    const res = await api.post(`/api/customers/${customerId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -100 });
    expect(res.status).toBe(400);
  });

  it('should return ledger detail', async () => {
    const res = await api.get(`/api/customers/${customerId}/ledger`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.customer.id).toBe(customerId);
    expect(res.body.transactions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.payments.length).toBeGreaterThanOrEqual(1);
    expect(res.body.balance).toBe(res.body.total_credit - res.body.total_paid);
  });

  it('should not delete customer with transactions', async () => {
    const res = await api.delete(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
