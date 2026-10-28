import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, loginMobile } from './helpers.js';

describe('website enquiries', () => {
  let app: INestApplication;
  let token: string;
  let enquiryId: string;

  beforeAll(async () => {
    app = await createApp();
    token = (await loginMobile(app)).accessToken;
  });
  afterAll(async () => {
    await app.close();
  });

  it('rejects an enquiry without a valid Indian mobile number', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/public/enquiries').send({ name: 'E2E Person', phone: '12345', service: 'GST' }).expect(400);
    expect(res.body.details.join(' ')).toContain('mobile');
  });

  it('rejects unknown fields and unknown services', async () => {
    await request(app.getHttpServer()).post('/api/v1/public/enquiries').send({ name: 'E2E Person', phone: '9876543210', service: 'Astrology' }).expect(400);
    await request(app.getHttpServer()).post('/api/v1/public/enquiries').send({ name: 'E2E Person', phone: '9876543210', service: 'GST', admin: true }).expect(400);
  });

  it('accepts a public enquiry without authentication and normalises the phone number', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/public/enquiries')
      .send({ name: 'E2E Person', phone: '+91 98765-43210', service: 'Incorporation', message: 'e2e test', sourcePage: '/contact' })
      .expect(201);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    enquiryId = res.body.id;

    const detail = await request(app.getHttpServer()).get(`/api/v1/enquiries/${enquiryId}`).set('authorization', `Bearer ${token}`).expect(200);
    expect(detail.body.phone).toBe('+919876543210');
    expect(detail.body.status).toBe('NEW');
  });

  it('silently drops honeypot submissions', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/public/enquiries').send({ name: 'Bot', phone: '9876543210', service: 'GST', website: 'http://spam' }).expect(201);
    expect(res.body.id).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('requires leads.read to list and leads.manage to update', async () => {
    await request(app.getHttpServer()).get('/api/v1/enquiries').expect(401);
    const list = await request(app.getHttpServer()).get('/api/v1/enquiries?status=NEW&q=E2E').set('authorization', `Bearer ${token}`).expect(200);
    expect(list.body.items.some((i: { id: string }) => i.id === enquiryId)).toBe(true);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/enquiries/${enquiryId}`)
      .set('authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTED', notes: 'Called back' })
      .expect(200);
    expect(updated.body.status).toBe('CONTACTED');
    expect(updated.body.handledAt).not.toBeNull();
  });
});
