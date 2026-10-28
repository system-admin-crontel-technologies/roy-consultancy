import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { connect as tcpConnect } from 'node:net';
import type { IntegrationSummary } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import type { Env } from '../config/env.js';
import type { Prisma } from '../generated/prisma/client.js';
import { IntegrationStatus } from '../generated/prisma/enums.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateIntegrationDto } from './integrations.schemas.js';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async list(): Promise<IntegrationSummary[]> {
    const rows = await this.prisma.integrationAccount.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    return rows.map((r) => this.toSummary(r));
  }

  private toSummary(r: Prisma.IntegrationAccountGetPayload<object>): IntegrationSummary {
    return {
      key: r.key,
      name: r.name,
      category: r.category,
      provider: r.provider,
      status: r.status,
      config: (r.config as Record<string, unknown> | null) ?? null,
      secretRef: r.secretRef,
      lastHealthCheckAt: r.lastHealthCheckAt?.toISOString() ?? null,
      lastHealthOk: r.lastHealthOk,
      lastError: r.lastError,
    };
  }

  async update(actor: Principal, key: string, dto: UpdateIntegrationDto, meta: RequestMeta): Promise<IntegrationSummary> {
    const before = await this.prisma.integrationAccount.findUnique({ where: { key } });
    if (!before) throw new NotFoundException('Integration not found.');
    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.integrationAccount.update({
        where: { key },
        data: { ...dto, config: dto.config === undefined ? undefined : (dto.config as Prisma.InputJsonValue), updatedById: actor.userId },
      });
      await this.audit.record({ tx, actor, meta, action: 'integrations.update', resourceType: 'integration', resourceId: key, before, after: r });
      return r;
    });
    return this.toSummary(updated);
  }

  async healthCheck(actor: Principal, key: string, meta: RequestMeta): Promise<IntegrationSummary> {
    const row = await this.prisma.integrationAccount.findUnique({ where: { key } });
    if (!row) throw new NotFoundException('Integration not found.');
    let ok = true;
    let error: string | null = null;
    try {
      await this.probe(key);
    } catch (err) {
      ok = false;
      error = safeError(err);
    }
    const updated = await this.prisma.integrationAccount.update({
      where: { key },
      data: {
        lastHealthCheckAt: new Date(),
        lastHealthOk: ok,
        lastError: error,
        status: row.status === IntegrationStatus.DISABLED ? row.status : ok ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR,
      },
    });
    await this.audit.record({ actor, meta, action: 'integrations.health_check', resourceType: 'integration', resourceId: key, outcome: ok ? 'SUCCESS' : 'FAILURE', metadata: { error } });
    return this.toSummary(updated);
  }

  /** Probes use only server-side environment secrets; nothing from the request. */
  private async probe(key: string): Promise<void> {
    switch (key) {
      case 'DATABASE':
        await this.prisma.$queryRaw`SELECT 1`;
        return;
      case 'REDIS': {
        const redis = new Redis(this.config.get('REDIS_URL', { infer: true }), { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 3000 });
        try {
          await redis.connect();
          await redis.ping();
        } finally {
          redis.disconnect();
        }
        return;
      }
      case 'EMAIL_SMTP':
        await this.mail.verify();
        return;
      case 'OBJECT_STORAGE': {
        const endpoint = this.config.get('S3_ENDPOINT', { infer: true });
        const bucket = this.config.get('S3_BUCKET', { infer: true });
        const accessKeyId = this.config.get('S3_ACCESS_KEY', { infer: true });
        const secretAccessKey = this.config.get('S3_SECRET_KEY', { infer: true });
        if (!bucket || !accessKeyId || !secretAccessKey) throw new Error('S3 bucket or credentials are not configured');
        const client = new S3Client({
          region: this.config.get('S3_REGION', { infer: true }),
          ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
          credentials: { accessKeyId, secretAccessKey },
        });
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
        return;
      }
      case 'MALWARE_SCAN': {
        const host = this.config.get('CLAMAV_HOST', { infer: true });
        if (!host) throw new Error('CLAMAV_HOST is not configured');
        await clamPing(host, this.config.get('CLAMAV_PORT', { infer: true }));
        return;
      }
      default:
        throw new Error('No automated health check is available for this integration; verify it manually.');
    }
  }
}

function clamPing(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = tcpConnect({ host, port, timeout: 3000 });
    socket.once('connect', () => socket.write('zPING\0'));
    socket.once('data', (d) => {
      socket.end();
      if (d.toString().startsWith('PONG')) resolve();
      else reject(new Error('Unexpected ClamAV response'));
    });
    socket.once('timeout', () => { socket.destroy(); reject(new Error('ClamAV connection timed out')); });
    socket.once('error', (e) => reject(e));
  });
}

function safeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Never persist credentials that providers sometimes echo back.
  return msg.replace(/(password|secret|token)=\S+/gi, '$1=[REDACTED]').slice(0, 500);
}
