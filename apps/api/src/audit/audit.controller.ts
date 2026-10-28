import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { paginated, skipTake } from '../common/utils/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { auditQuerySchema, type AuditQuery } from './audit.schemas.js';

@ApiTags('audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Search the append-only audit log' })
  async list(@Query({ schema: auditQuerySchema }) q: AuditQuery) {
    const where = {
      ...(q.actorUserId ? { actorUserId: q.actorUserId } : {}),
      ...(q.action ? { action: { startsWith: q.action } } : {}),
      ...(q.resourceType ? { resourceType: q.resourceType } : {}),
      ...(q.resourceId ? { resourceId: q.resourceId } : {}),
      ...(q.outcome ? { outcome: q.outcome } : {}),
      ...(q.from || q.to ? { occurredAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}),
      ...(q.q
        ? {
            OR: [
              { action: { contains: q.q, mode: 'insensitive' as const } },
              { actorLabel: { contains: q.q, mode: 'insensitive' as const } },
              { resourceId: { contains: q.q, mode: 'insensitive' as const } },
              { correlationId: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, orderBy: { occurredAt: 'desc' }, ...skipTake(q) }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  @Get('actions')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Distinct action and resource type values for filters' })
  async facets() {
    const [actions, resourceTypes] = await Promise.all([
      this.prisma.auditLog.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' } }),
      this.prisma.auditLog.findMany({ distinct: ['resourceType'], select: { resourceType: true }, orderBy: { resourceType: 'asc' } }),
    ]);
    return { actions: actions.map((a) => a.action), resourceTypes: resourceTypes.map((r) => r.resourceType) };
  }
}
