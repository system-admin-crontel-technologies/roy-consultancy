import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DepartmentDto, UpdateDepartmentDto } from './users.schemas.js';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const rows = await this.prisma.department.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true } } } });
    return rows.map((d) => ({ id: d.id, code: d.code, name: d.name, isActive: d.isActive, userCount: d._count.users }));
  }

  async create(actor: Principal, dto: DepartmentDto, meta: RequestMeta) {
    return this.prisma.$transaction(async (tx) => {
      const d = await tx.department.create({ data: { code: dto.code, name: dto.name, isActive: dto.isActive ?? true } });
      await this.audit.record({ tx, actor, meta, action: 'departments.create', resourceType: 'department', resourceId: d.id, after: d });
      return d;
    });
  }

  async update(actor: Principal, id: string, dto: UpdateDepartmentDto, meta: RequestMeta) {
    const before = await this.prisma.department.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Department not found.');
    return this.prisma.$transaction(async (tx) => {
      const d = await tx.department.update({ where: { id }, data: dto });
      await this.audit.record({ tx, actor, meta, action: 'departments.update', resourceType: 'department', resourceId: id, before, after: d });
      return d;
    });
  }
}
