import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';
import { format } from 'date-fns';

describe('Reports API', () => {
  let token: string;
  let api: any;
  
  beforeAll(async () => {
    api = await getApp();
    const pw = process.env.ADMIN_PASSWORD;
    const res = await api.post('/api/auth/login').send({ email: 'owner@example.com', password: pw });
    token = res.body.token;
  });

  it('should fetch daily report with valid YYYY-MM-DD date', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const res = await api.get(`/api/reports/daily?date=${today}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
    expect(typeof res.body.totalSales).toBe('number');
  });

  it('should reject invalid date format for daily report', async () => {
    const res = await api.get(`/api/reports/daily?date=invalid-date`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
  
  it('should fetch monthly report with valid YYYY-MM date', async () => {
    const month = format(new Date(), 'yyyy-MM');
    const res = await api.get(`/api/reports/monthly?month=${month}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.month).toBe(month);
    expect(typeof res.body.total_revenue).toBe('number');
  });
});
