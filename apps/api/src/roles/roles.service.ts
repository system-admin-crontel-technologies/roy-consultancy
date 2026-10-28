import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PERMISSIONS, type PermissionCode, type RoleSummary } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import { AuthService } from '../auth/auth.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateRoleDto, SetPermissionsDto, UpdateRoleDto } from './roles.schemas.js';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  async listPermissions() {
    const rows = await this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
    return rows.map((p) => ({ code: p.code, module: p.module, description: p.description }));
  }

  async list(): Promise<RoleSummary[]> {
    const rows = await this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { permissions: { include: { permission: { select: { code: true } } } }, _count: { select: { users: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions.map((p) => p.permission.code).sort(),
      userCount: r._count.users,
    }));
  }

  async get(id: string): Promise<RoleSummary> {
    const all = await this.list();
    const role = all.find((r) => r.id === id);
    if (!role) throw new NotFoundException('Role not found.');
    return role;
  }

  async create(actor: Principal, dto: CreateRoleDto, meta: RequestMeta): Promise<RoleSummary> {
    if (await this.prisma.role.findUnique({ where: { code: dto.code } })) throw new ConflictException('Role code already exists.');
    const perms = await this.resolvePermissions(dto.permissions);
    const role = await this.prisma.$transaction(async (tx) => {
      const r = await tx.role.create({
        data: {
          code: dto.code, name: dto.name, description: dto.description ?? null, isSystem: false,
          permissions: { create: perms.map((p) => ({ permissionId: p.id, grantedById: actor.userId })) },
        },
      });
      await this.audit.record({ tx, actor, meta, action: 'roles.create', resourceType: 'role', resourceId: r.id, after: { ...dto } });
      return r;
    });
    return this.get(role.id);
  }

  async update(actor: Principal, id: string, dto: UpdateRoleDto, meta: RequestMeta): Promise<RoleSummary> {
    const before = await this.prisma.role.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Role not found.');
    await this.prisma.$transaction(async (tx) => {
      const r = await tx.role.update({ where: { id }, data: dto });
      await this.audit.record({
        tx, actor, meta, action: 'roles.update', resourceType: 'role', resourceId: id,
        before: { name: before.name, description: before.description }, after: { name: r.name, description: r.description },
      });
    });
    return this.get(id);
  }

  async setPermissions(actor: Principal, id: string, dto: SetPermissionsDto, meta: RequestMeta): Promise<RoleSummary> {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } });
    if (!role) throw new NotFoundException('Role not found.');
    if (role.code === 'SUPER_ADMIN') throw new BadRequestException('Super Admin permissions are fixed and cannot be edited.');
    const perms = await this.resolvePermissions(dto.permissions);
    const beforeCodes = role.permissions.map((p) => p.permission.code).sort();
    const afterCodes = perms.map((p) => p.code).sort();

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.rolePermission.createMany({ data: perms.map((p) => ({ roleId: id, permissionId: p.id, grantedById: actor.userId })) });
      await this.audit.record({
        tx, actor, meta, action: 'roles.permissions.set', resourceType: 'role', resourceId: id,
        before: { permissions: beforeCodes }, after: { permissions: afterCodes },
        metadata: { added: afterCodes.filter((c) => !beforeCodes.includes(c)), removed: beforeCodes.filter((c) => !afterCodes.includes(c)) },
      });
    });
    // Users holding this role get fresh permissions within the cache window.
    const holders = await this.prisma.userRole.findMany({ where: { roleId: id }, select: { userId: true } });
    for (const h of holders) this.auth.invalidateUser(h.userId);
    return this.get(id);
  }

  private async resolvePermissions(codes: string[]) {
    const unique = [...new Set(codes)];
    const unknown = unique.filter((c) => !(c in PERMISSIONS));
    if (unknown.length) throw new BadRequestException(`Unknown permission(s): ${unknown.join(', ')}`);
    return this.prisma.permission.findMany({ where: { code: { in: unique as PermissionCode[] } } });
  }
}
