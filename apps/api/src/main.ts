import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService<Env, true>);

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }).split(',').map((o) => o.trim()),
    credentials: true,
    exposedHeaders: ['x-correlation-id'],
  });
  app.enableShutdownHooks();

  const openapi = new DocumentBuilder()
    .setTitle('Roy Consultancy Operations Platform API')
    .setDescription('REST API. Browser clients authenticate with HttpOnly cookies; mobile clients use Bearer tokens.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addCookieAuth('rc_access')
    .build();
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, openapi), { jsonDocumentUrl: 'api/docs-json' });

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`API listening on http://localhost:${port}/api/v1 (docs at /api/docs)`);
}

await bootstrap();
