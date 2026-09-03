import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';

describe('Idempotency API', () => {
  let token: string;
  let api: any;
  let productId: string;
  
  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;

    const prodRes = await api.post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: "Idempotency Test Item",
        purchase_price: 10,
        selling_price: 20,
        stock: 10,
        unit: "Pcs"
      });
    productId = prodRes.body.id;
  });

  it('should ignore duplicate checkouts using the same idempotency key', async () => {
    const key = `test-key-${Date.now()}`;
    
    // First request
    const res1 = await api.post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        idempotency_key: key,
        items: [{ product_id: productId, qty: 1 }]
      });
    
    expect(res1.status).toBe(200);
    const txId = res1.body.id;

    // Second request with SAME key
    const res2 = await api.post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        idempotency_key: key,
        items: [{ product_id: productId, qty: 1 }]
      });
    
    // Should return exactly the same transaction ID and 200 OK
    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(txId);

    // Stock should have only decremented by 1 (stock was 10 -> 9)
    const checkRes = await api.get('/api/products').set('Authorization', `Bearer ${token}`);
    const finalProd = checkRes.body.find((p: any) => p.id === productId);
    expect(finalProd.stock).toBe(9);
  });
});
