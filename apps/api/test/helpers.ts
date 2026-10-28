import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

export const SUPER_ADMIN = {
  email: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@royconsultancy.local',
  password: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe!12345',
};

export async function loginMobile(app: INestApplication, email = SUPER_ADMIN.email, password = SUPER_ADMIN.password) {
  const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password, client: 'MOBILE' }).expect(200);
  return { accessToken: res.body.accessToken as string, refreshToken: res.body.refreshToken as string, user: res.body.user };
}
