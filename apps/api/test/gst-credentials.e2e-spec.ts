import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, loginMobile } from './helpers.js';

describe('GST credentials', () => {
  let app: INestApplication;
  let token: string;
  let id: string;
  const clientName = `E2E Traders ${Date.now()}`;
  const auth = () => ({ authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createApp();
    token = (await loginMobile(app)).accessToken;
  });
  afterAll(async () => {
    if (id) await request(app.getHttpServer()).delete(`/api/v1/gst-credentials/${id}`).set(auth());
    await app.close();
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/gst-credentials').expect(401);
  });

  it('validates input', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/gst-credentials').set(auth()).send({ clientName: '', username: 'x' }).expect(400);
    expect(res.body.details.join(' ')).toMatch(/Client name|Password/);
  });

  it('stores the password encrypted and never lists it', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/gst-credentials')
      .set(auth())
      .send({ clientName, username: 'e2e_gst_user', password: ' P@ss word#1 ' })
      .expect(201);
    id = created.body.id;
    expect(created.body).not.toHaveProperty('password');
    expect(created.body).not.toHaveProperty('passwordCiphertext');

    const row = await app.get(PrismaService).gstCredential.findUniqueOrThrow({ where: { id } });
    expect(row.passwordCiphertext).not.toContain('P@ss');

    const list = await request(app.getHttpServer()).get(`/api/v1/gst-credentials?q=${encodeURIComponent(clientName.toLowerCase())}`).set(auth()).expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toContain('P@ss');
  });

  it('reveals the exact password and audits the reveal', async () => {
    const res = await request(app.getHttpServer()).post(`/api/v1/gst-credentials/${id}/reveal`).set(auth()).expect(200);
    expect(res.body.password).toBe(' P@ss word#1 ');
    expect(res.headers['cache-control']).toBe('no-store');
    const audit = await app.get(PrismaService).auditLog.findFirst({ where: { action: 'gst_credentials.reveal', resourceId: id } });
    expect(audit).not.toBeNull();
    expect(JSON.stringify(audit)).not.toContain('P@ss');
  });

  it('updates the password and deletes the record', async () => {
    await request(app.getHttpServer()).patch(`/api/v1/gst-credentials/${id}`).set(auth()).send({ password: 'NewPass!2' }).expect(200);
    const res = await request(app.getHttpServer()).post(`/api/v1/gst-credentials/${id}/reveal`).set(auth()).expect(200);
    expect(res.body.password).toBe('NewPass!2');

    await request(app.getHttpServer()).delete(`/api/v1/gst-credentials/${id}`).set(auth()).expect(204);
    await request(app.getHttpServer()).post(`/api/v1/gst-credentials/${id}/reveal`).set(auth()).expect(404);
    id = '';
  });
});
