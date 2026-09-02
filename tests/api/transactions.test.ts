import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';

describe('Transactions API (Concurrency)', () => {
  let token: string;
  let api: any;
  let productId: string;
  
  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;

    // Create a product with 3 stock
    const prodRes = await api.post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: "Test Stock Concurrency",
        category: "Test",
        purchase_price: 1000,
        selling_price: 1500,
        stock: 3,
        unit: "Pcs"
      });
    productId = prodRes.body.id;
  });

  it('should prevent overselling on concurrent checkout', async () => {
    // Attempt 5 simultaneous purchases of 1 item (stock is 3)
    const requests = Array.from({ length: 5 }).map(() => 
      api.post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [{ product_id: productId, qty: 1 }]
        })
    );

    const responses = await Promise.all(requests);
    const successes = responses.filter(r => r.status === 200 || r.status === 201);
    const failures = responses.filter(r => r.status === 400);

    expect(successes.length).toBe(3);
    expect(failures.length).toBe(2);
    
    // Check final stock is 0
    const checkRes = await api.get('/api/products').set('Authorization', `Bearer ${token}`);
    const finalProd = checkRes.body.find((p: any) => p.id === productId);
    expect(finalProd.stock).toBe(0);
  });
});
