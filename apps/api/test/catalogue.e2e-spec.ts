import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, loginMobile } from './helpers.js';

describe('catalogue versioning (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let categoryId: string;
  const code = `E2E-${Date.now()}`;
  let serviceId: string;

  beforeAll(async () => {
    app = await createApp();
    token = (await loginMobile(app)).accessToken;
    const cat = await request(app.getHttpServer()).post('/api/v1/catalogue/categories').set('authorization', `Bearer ${token}`).send({ code, name: 'E2E category' }).expect(201);
    categoryId = cat.body.id;
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    if (serviceId) await prisma.service.delete({ where: { id: serviceId } }).catch(() => undefined);
    await prisma.serviceCategory.delete({ where: { id: categoryId } }).catch(() => undefined);
    await app.close();
  });

  const auth = () => ({ authorization: `Bearer ${token}` });

  it('creates a draft, requires a price to publish, then freezes the version', async () => {
    const created = await request(app.getHttpServer()).post('/api/v1/catalogue/services').set(auth()).send({ code, name: 'E2E service', categoryId }).expect(201);
    serviceId = created.body.id;
    expect(created.body.status).toBe('DRAFT');
    const v1 = created.body.versions[0];

    await request(app.getHttpServer()).post(`/api/v1/catalogue/services/${serviceId}/status`).set(auth()).send({ status: 'ACTIVE' }).expect(400);
    await request(app.getHttpServer()).post(`/api/v1/catalogue/services/${serviceId}/versions/${v1.id}/publish`).set(auth()).expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/catalogue/services/${serviceId}/versions/${v1.id}`)
      .set(auth())
      .send({ taskTemplate: [{ key: 'a', title: 'A', role: 'REVIEWER', dependsOn: ['missing'] }] })
      .expect(400);

    await request(app.getHttpServer()).put(`/api/v1/catalogue/services/${serviceId}/versions/${v1.id}/price`).set(auth()).send({ professionalFeeMinor: 100000, taxRateBps: 1800 }).expect(200);
    const published = await request(app.getHttpServer()).post(`/api/v1/catalogue/services/${serviceId}/versions/${v1.id}/publish`).set(auth()).expect(200);
    expect(published.body.isCurrent).toBe(true);

    await request(app.getHttpServer()).patch(`/api/v1/catalogue/services/${serviceId}/versions/${v1.id}`).set(auth()).send({ summary: 'nope' }).expect(400);
    await request(app.getHttpServer()).post(`/api/v1/catalogue/services/${serviceId}/status`).set(auth()).send({ status: 'ACTIVE' }).expect(200);

    const v2 = await request(app.getHttpServer()).post(`/api/v1/catalogue/services/${serviceId}/versions`).set(auth()).expect(201);
    expect(v2.body.versionNumber).toBe(2);
    expect(v2.body.price.professionalFeeMinor).toBe(100000);
    await request(app.getHttpServer()).post(`/api/v1/catalogue/services/${serviceId}/versions/${v2.body.id}/publish`).set(auth()).expect(200);
    const detail = await request(app.getHttpServer()).get(`/api/v1/catalogue/services/${serviceId}`).set(auth()).expect(200);
    expect(detail.body.versions.filter((v: { isCurrent: boolean }) => v.isCurrent)).toHaveLength(1);
    expect(detail.body.currentVersion.versionNumber).toBe(2);
  });
});
