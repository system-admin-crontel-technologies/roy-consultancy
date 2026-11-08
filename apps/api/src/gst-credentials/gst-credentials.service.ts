import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GstCredential, Paginated } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { paginated, skipTake } from '../common/utils/pagination.js';
import { SecretBox } from '../common/utils/secret-box.js';
import type { Env } from '../config/env.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateGstCredentialDto, GstCredentialQuery, UpdateGstCredentialDto } from './gst-credentials.schemas.js';

const RESOURCE = 'gst_credential';

@Injectable()
export class GstCredentialsService {
  private readonly box: SecretBox | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService<Env, true>,
  ) {
    const key = config.get('CREDENTIALS_ENCRYPTION_KEY', { infer: true });
    // A bad key is a deployment error and should stop the API; a missing key only disables this module.
    this.box = key ? new SecretBox(key) : null;
  }

  private secretBox(): SecretBox {
    if (!this.box) throw new ServiceUnavailableException('Credential storage is not configured on this server (CREDENTIALS_ENCRYPTION_KEY is missing).');
    return this.box;
  }

  async list(q: GstCredentialQuery): Promise<Paginated<GstCredential>> {
    const where: Prisma.GstCredentialWhereInput = q.q ? { clientName: { contains: q.q, mode: 'insensitive' } } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.gstCredential.findMany({ where, orderBy: [{ clientName: 'asc' }, { createdAt: 'asc' }], ...skipTake(q) }),
      this.prisma.gstCredential.count({ where }),
    ]);
    return paginated(items.map(toSummary), total, q);
  }

  async create(actor: Principal, dto: CreateGstCredentialDto, meta: RequestMeta): Promise<GstCredential> {
    const passwordCiphertext = this.secretBox().encrypt(dto.password);
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.gstCredential.create({
        data: { clientName: dto.clientName, username: dto.username, passwordCiphertext, createdById: actor.userId, updatedById: actor.userId },
      });
      await this.audit.record({ tx, actor, meta, action: 'gst_credentials.create', resourceType: RESOURCE, resourceId: created.id, after: { clientName: created.clientName, username: created.username } });
      return created;
    });
    return toSummary(row);
  }

  async update(actor: Principal, id: string, dto: UpdateGstCredentialDto, meta: RequestMeta): Promise<GstCredential> {
    const before = await this.find(id);
    const passwordCiphertext = dto.password !== undefined ? this.secretBox().encrypt(dto.password) : undefined;
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.gstCredential.update({
        where: { id },
        data: {
          ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
          ...(dto.username !== undefined ? { username: dto.username } : {}),
          ...(passwordCiphertext ? { passwordCiphertext } : {}),
          updatedById: actor.userId,
        },
      });
      await this.audit.record({
        tx, actor, meta, action: 'gst_credentials.update', resourceType: RESOURCE, resourceId: id,
        before: { clientName: before.clientName, username: before.username },
        after: { clientName: updated.clientName, username: updated.username },
        metadata: { loginRotated: passwordCiphertext !== undefined },
      });
      return updated;
    });
    return toSummary(row);
  }

  async remove(actor: Principal, id: string, meta: RequestMeta): Promise<void> {
    const before = await this.find(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.gstCredential.delete({ where: { id } });
      await this.audit.record({ tx, actor, meta, action: 'gst_credentials.delete', resourceType: RESOURCE, resourceId: id, before: { clientName: before.clientName, username: before.username } });
    });
  }

  /** Decrypts one password for copy/show. Every reveal is written to the audit log (without the password). */
  async reveal(actor: Principal, id: string, meta: RequestMeta): Promise<{ password: string }> {
    const row = await this.find(id);
    const password = this.secretBox().decrypt(row.passwordCiphertext);
    await this.audit.record({ actor, meta, action: 'gst_credentials.reveal', resourceType: RESOURCE, resourceId: id, metadata: { clientName: row.clientName } });
    return { password };
  }

  private async find(id: string) {
    const row = await this.prisma.gstCredential.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('GST credential not found.');
    return row;
  }
}

function toSummary(r: Prisma.GstCredentialGetPayload<object>): GstCredential {
  return { id: r.id, clientName: r.clientName, username: r.username, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}
