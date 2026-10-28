import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminOverview } from '@roy/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { IntegrationStatus, ServiceStatus, UserStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('admin')
@Controller('admin')
export class OverviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  @RequirePermissions('users.read', 'audit.read')
  @ApiOperation({ summary: 'Super Admin dashboard counters and recent activity' })
  async overview(): Promise<AdminOverview> {
    const [userGroups, roles, serviceGroups, categories, integrationGroups, recentAudit, recentAuth] = await Promise.all([
      this.prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.role.count(),
      this.prisma.service.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.serviceCategory.count({ where: { isActive: true } }),
      this.prisma.integrationAccount.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.auditLog.findMany({ orderBy: { occurredAt: 'desc' }, take: 10 }),
      this.prisma.authEvent.findMany({ orderBy: { occurredAt: 'desc' }, take: 10, select: { id: true, type: true, email: true, occurredAt: true, ipAddress: true } }),
    ]);
    const count = <T extends string>(groups: { [k: string]: unknown; _count: { _all: number } }[], key: string, value: T) =>
      groups.find((g) => g[key] === value)?._count._all ?? 0;
    const userTotal = userGroups.reduce((n, g) => n + g._count._all, 0);
    const serviceTotal = serviceGroups.reduce((n, g) => n + g._count._all, 0);
    const integrationTotal = integrationGroups.reduce((n, g) => n + g._count._all, 0);
    return {
      users: {
        total: userTotal,
        active: count(userGroups, 'status', UserStatus.ACTIVE),
        invited: count(userGroups, 'status', UserStatus.INVITED),
        suspended: count(userGroups, 'status', UserStatus.SUSPENDED),
        disabled: count(userGroups, 'status', UserStatus.DISABLED),
      },
      roles,
      services: { total: serviceTotal, active: count(serviceGroups, 'status', ServiceStatus.ACTIVE), draft: count(serviceGroups, 'status', ServiceStatus.DRAFT) },
      categories,
      integrations: { total: integrationTotal, active: count(integrationGroups, 'status', IntegrationStatus.ACTIVE), error: count(integrationGroups, 'status', IntegrationStatus.ERROR) },
      recentAudit: recentAudit.map((a) => ({ ...a, occurredAt: a.occurredAt.toISOString() })) as AdminOverview['recentAudit'],
      recentAuthEvents: recentAuth.map((e) => ({ ...e, occurredAt: e.occurredAt.toISOString() })),
    };
  }
}
