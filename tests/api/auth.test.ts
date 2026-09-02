import { describe, it, expect, beforeAll } from 'vitest';
import { getApp } from './setup';

describe('Auth API', () => {
  it('should fail login without credentials', async () => {
    const api = await getApp();
    const res = await api.post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
