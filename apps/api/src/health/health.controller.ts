import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Redis } from 'ioredis';
import { Public } from '../common/decorators/public.decorator.js';
import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready() {
    const checks: Record<string, 'up' | 'down'> = { database: 'down', redis: 'down' };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch { /* reported below */ }
    const redis = new Redis(this.config.get('REDIS_URL', { infer: true }), { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000 });
    try {
      await redis.connect();
      await redis.ping();
      checks.redis = 'up';
    } catch { /* reported below */ } finally {
      redis.disconnect();
    }
    const ok = Object.values(checks).every((c) => c === 'up');
    if (!ok) throw new ServiceUnavailableException({ status: 'degraded', checks });
    return { status: 'ok', checks };
  }
}
