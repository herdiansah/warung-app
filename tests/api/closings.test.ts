import { describe, it, expect, beforeAll } from 'vitest';
import { format } from 'date-fns';
import { getApp } from './setup';

describe('Daily Closing API', () => {
  let token: string;
  let api: any;
  const today = format(new Date(), 'yyyy-MM-dd');

  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;
    // Top up kas so expected cash for today is positive (kulakan may exceed sales in test data)
    await api.post('/api/cash')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: "in", category: "modal", amount: 5000000, note: "Modal awal tes closing" });
  });

  it('should return expected cash preview for a date', async () => {
    const res = await api.get(`/api/closings/${today}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("expected");
    expect(res.body.expected).toBe(
      res.body.sales_cash + res.body.payments_in + res.body.cash_in - res.body.cash_out
    );
  });

  it('should reject invalid date format', async () => {
    const res = await api.get('/api/closings/2026-13-99')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('should save a closing with computed difference', async () => {
    const preview = await api.get(`/api/closings/${today}`).set('Authorization', `Bearer ${token}`);
    const expected = preview.body.expected;

    const res = await api.post('/api/closings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, actual_cash: expected + 500, note: "Tes selisih lebih" });
    expect(res.status).toBe(200);
    expect(Number(res.body.difference)).toBe(500);
    expect(Number(res.body.actual_cash)).toBe(expected + 500);
  });

  it('should update (upsert) closing on same date', async () => {
    const preview = await api.get(`/api/closings/${today}`).set('Authorization', `Bearer ${token}`);
    const res = await api.post('/api/closings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, actual_cash: preview.body.expected });
    expect(res.status).toBe(200);
    expect(Number(res.body.difference)).toBe(0);

    const list = await api.get('/api/closings').set('Authorization', `Bearer ${token}`);
    const forToday = list.body.filter((c: any) => c.date === today);
    expect(forToday.length).toBe(1);
  });

  it('should reject negative actual cash', async () => {
    const res = await api.post('/api/closings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, actual_cash: -1 });
    expect(res.status).toBe(400);
  });
});
