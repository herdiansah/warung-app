import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';

describe('Health endpoint', () => {
  let api: any;

  beforeAll(async () => {
    api = await getApp();
  });

  it('GET /api/health returns 200 with status ok', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/health/ready returns 200 when DB is reachable', async () => {
    const res = await api.get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.db).toBe('up');
  });
});