import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogueModule } from './catalogue/catalogue.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { EnquiriesModule } from './enquiries/enquiries.module.js';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware.js';
import { validateEnv } from './config/env.js';
import { HealthModule } from './health/health.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { MailModule } from './mail/mail.module.js';
import { OverviewModule } from './overview/overview.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RolesModule } from './roles/roles.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(import.meta.dirname, '../../../.env'), resolve(import.meta.dirname, '../.env')],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        enabled: process.env.NODE_ENV !== 'test',
        serializers: {
          req: (req: { id: unknown; method: string; url: string }) => ({ id: req.id, method: req.method, url: req.url }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        },
        genReqId: (req) => (req as { correlationId?: string }).correlationId ?? String(req.headers['x-correlation-id'] ?? randomUUID()),
        redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'], censor: '[REDACTED]' },
        autoLogging: { ignore: (req) => (req.url ?? '').startsWith('/api/v1/health') },
        ...(process.env.NODE_ENV !== 'production' ? { transport: { target: 'pino-pretty', options: { singleLine: true } } } : {}),
      },
    }),
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }] }),
    PrismaModule,
    AuditModule,
    MailModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SettingsModule,
    IntegrationsModule,
    CatalogueModule,
    EnquiriesModule,
    OverviewModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new StandardSchemaValidationPipe({ transform: true }) },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
