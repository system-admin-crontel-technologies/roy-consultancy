import { Injectable, Logger } from '@nestjs/common';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { redact } from '../common/utils/redact.js';
import { AuditActorType, AuditOutcome } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Principal } from '../auth/principal.js';

export interface AuditInput {
  actor: Principal | { system: string };
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  meta?: RequestMeta;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  /** Optional transaction client so the audit row commits with the business change. */
  tx?: Prisma.TransactionClient;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput): Promise<void> {
    const isSystem = 'system' in input.actor;
    const db = input.tx ?? this.prisma;
    try {
      await db.auditLog.create({
        data: {
          actorType: isSystem ? AuditActorType.SYSTEM : AuditActorType.USER,
          actorUserId: isSystem ? null : (input.actor as Principal).userId,
          actorLabel: isSystem ? (input.actor as { system: string }).system : (input.actor as Principal).email,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId ?? null,
          outcome: (input.outcome ?? 'SUCCESS') as AuditOutcome,
          correlationId: input.meta?.correlationId ?? null,
          ipAddress: input.meta?.ipAddress ?? null,
          userAgent: input.meta?.userAgent ?? null,
          before: input.before === undefined ? undefined : (redact(input.before) as Prisma.InputJsonValue),
          after: input.after === undefined ? undefined : (redact(input.after) as Prisma.InputJsonValue),
          metadata: input.metadata === undefined ? undefined : (redact(input.metadata) as Prisma.InputJsonValue),
        },
      });
    } catch (err) {
      // Audit failures must never break the business operation when outside a transaction,
      // but they must be visible to operators.
      if (input.tx) throw err;
      this.logger.error({ msg: 'audit write failed', action: input.action, err: (err as Error).message });
    }
  }
}
