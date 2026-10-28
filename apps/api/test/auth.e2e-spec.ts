import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, loginMobile, SUPER_ADMIN } from './helpers.js';

describe('auth (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated access with the standard error shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/users').expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, error: 'Unauthorized' });
    expect(res.body.correlationId).toBeTruthy();
    expect(res.headers['x-correlation-id']).toBe(res.body.correlationId);
  });

  it('rejects bad credentials without revealing whether the user exists', async () => {
    const a = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'nobody@example.test', password: 'WrongPassword1' }).expect(401);
    const b = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: SUPER_ADMIN.email, password: 'WrongPassword1' }).expect(401);
    expect(a.body.message).toBe(b.body.message);
  });

  it('issues web cookies and returns the principal', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: SUPER_ADMIN.email, password: SUPER_ADMIN.password }).expect(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('rc_access=') && /HttpOnly/i.test(c))).toBe(true);
    expect(cookies.some((c) => c.startsWith('rc_refresh=') && c.includes('Path=/api/v1/auth'))).toBe(true);
    expect(res.body.user.roles).toContain('SUPER_ADMIN');
    expect(res.body.accessToken).toBeUndefined();
  });

  it('rotates refresh tokens and detects reuse', async () => {
    const { refreshToken } = await loginMobile(app);
    const first = await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(200);
    expect(first.body.refreshToken).not.toBe(refreshToken);
    // Reusing the old token must fail and revoke the family, including the new token.
    await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: first.body.refreshToken }).expect(401);
  });

  it('logout revokes the session', async () => {
    const { accessToken } = await loginMobile(app);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('authorization', `Bearer ${accessToken}`).expect(200);
    await request(app.getHttpServer()).post('/api/v1/auth/logout').set('authorization', `Bearer ${accessToken}`).expect(204);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('authorization', `Bearer ${accessToken}`).expect(401);
  });

  it('validates bodies and rejects unknown fields', async () => {
    const { accessToken } = await loginMobile(app);
    const res = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ email: 'not-an-email', fullName: 'x', roleCodes: [], extra: true })
      .expect(400);
    expect(res.body.details.join(' ')).toMatch(/Unrecognized key/);
  });
});
