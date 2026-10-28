import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/auth/password.service.js';
import { createApp, loginMobile } from './helpers.js';

describe('authorization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const auditorEmail = `auditor.${Date.now()}@example.test`;
  const auditorPassword = 'AuditorPassword123';
  let auditorId: string;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'AUDITOR' } });
    const user = await prisma.user.create({
      data: {
        email: auditorEmail,
        fullName: 'E2E Auditor',
        status: 'ACTIVE',
        passwordHash: await app.get(PasswordService).hash(auditorPassword),
        roles: { create: { roleId: role.id } },
      },
    });
    auditorId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: auditorId } }).catch(() => undefined);
    await app.close();
  });

  it('read-only role can read but not write, and the denial is audited', async () => {
    const { accessToken } = await loginMobile(app, auditorEmail, auditorPassword);
    await request(app.getHttpServer()).get('/api/v1/users').set('authorization', `Bearer ${accessToken}`).expect(200);
    await request(app.getHttpServer()).get('/api/v1/audit-logs?pageSize=1').set('authorization', `Bearer ${accessToken}`).expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ email: 'x@example.test', fullName: 'Nope', roleCodes: ['AUDITOR'] })
      .expect(403);
    const denied = await prisma.auditLog.findFirst({ where: { actorUserId: auditorId, action: 'authz.denied' }, orderBy: { occurredAt: 'desc' } });
    expect(denied?.outcome).toBe('DENIED');
  });

  it('suspending a user revokes their sessions within the cache window', async () => {
    const auditor = await loginMobile(app, auditorEmail, auditorPassword);
    const admin = await loginMobile(app);
    await request(app.getHttpServer()).post(`/api/v1/users/${auditorId}/suspend`).set('authorization', `Bearer ${admin.accessToken}`).send({ reason: 'e2e test' }).expect(200);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('authorization', `Bearer ${auditor.accessToken}`).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: auditorEmail, password: auditorPassword, client: 'MOBILE' }).expect(401);
    await request(app.getHttpServer()).post(`/api/v1/users/${auditorId}/activate`).set('authorization', `Bearer ${admin.accessToken}`).send({ reason: 'e2e test' }).expect(200);
  });

  it('super admin cannot remove their own super admin role', async () => {
    const admin = await loginMobile(app);
    await request(app.getHttpServer()).post(`/api/v1/users/${admin.user.id}/roles`).set('authorization', `Bearer ${admin.accessToken}`).send({ roleCodes: ['AUDITOR'] }).expect(400);
  });

  it('audit log cannot be mutated through the database', async () => {
    const row = await prisma.auditLog.findFirst();
    expect(row).toBeTruthy();
    await expect(prisma.auditLog.delete({ where: { id: row!.id } })).rejects.toThrow();
  });
});
