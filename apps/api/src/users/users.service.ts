import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { UserSummary } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import { AuthService } from '../auth/auth.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { paginated, skipTake } from '../common/utils/pagination.js';
import { UserStatus } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { InviteUserDto, SetUserRolesDto, UpdateUserDto, UserListQuery } from './users.schemas.js';

const userInclude = {
  department: { select: { id: true, code: true, name: true } },
  manager: { select: { id: true, fullName: true } },
  roles: { include: { role: { select: { code: true, name: true } } } },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  private toSummary(u: UserRow): UserSummary {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      status: u.status,
      department: u.department,
      manager: u.manager,
      roles: u.roles.map((r) => r.role),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      isDemo: u.isDemo,
      createdAt: u.createdAt.toISOString(),
    };
  }

  async list(q: UserListQuery) {
    const where: Prisma.UserWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.departmentId ? { departmentId: q.departmentId } : {}),
      ...(q.role ? { roles: { some: { role: { code: q.role } } } } : {}),
      ...(q.q
        ? { OR: [{ email: { contains: q.q, mode: 'insensitive' } }, { fullName: { contains: q.q, mode: 'insensitive' } }] }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, include: userInclude, orderBy: [{ createdAt: 'desc' }], ...skipTake(q) }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(rows.map((r) => this.toSummary(r)), total, q);
  }

  async get(id: string): Promise<UserSummary> {
    const u = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    if (!u) throw new NotFoundException('User not found.');
    return this.toSummary(u);
  }

  async invite(actor: Principal, dto: InviteUserDto, meta: RequestMeta): Promise<UserSummary> {
    const existing = await this.prisma.user.findFirst({ where: { email: { equals: dto.email, mode: 'insensitive' } } });
    if (existing) throw new ConflictException('A user with this email already exists.');
    const roles = await this.resolveRoles(dto.roleCodes);
    await this.validateRefs(dto.departmentId, dto.managerId);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          phone: dto.phone ?? null,
          departmentId: dto.departmentId ?? null,
          managerId: dto.managerId ?? null,
          status: UserStatus.INVITED,
          createdById: actor.userId,
          updatedById: actor.userId,
          roles: { create: roles.map((r) => ({ roleId: r.id, assignedById: actor.userId })) },
        },
        include: userInclude,
      });
      await this.audit.record({
        tx, actor, meta, action: 'users.invite', resourceType: 'user', resourceId: created.id,
        after: { email: created.email, fullName: created.fullName, roles: roles.map((r) => r.code) },
      });
      return created;
    });
    await this.auth.sendInvitation(user.id, actor.fullName);
    return this.toSummary(user);
  }

  async resendInvite(actor: Principal, id: string, meta: RequestMeta) {
    await this.auth.sendInvitation(id, actor.fullName);
    await this.audit.record({ actor, meta, action: 'users.invite.resend', resourceType: 'user', resourceId: id });
  }

  async update(actor: Principal, id: string, dto: UpdateUserDto, meta: RequestMeta): Promise<UserSummary> {
    const before = await this.prisma.user.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('User not found.');
    if (dto.managerId === id) throw new BadRequestException('A user cannot be their own manager.');
    await this.validateRefs(dto.departmentId, dto.managerId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id }, data: { ...dto, updatedById: actor.userId }, include: userInclude });
      await this.audit.record({
        tx, actor, meta, action: 'users.update', resourceType: 'user', resourceId: id,
        before: pick(before, Object.keys(dto)), after: pick(u, Object.keys(dto)),
      });
      return u;
    });
    return this.toSummary(updated);
  }

  async setRoles(actor: Principal, id: string, dto: SetUserRolesDto, meta: RequestMeta): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    if (!user) throw new NotFoundException('User not found.');
    const roles = await this.resolveRoles(dto.roleCodes);
    const beforeCodes = user.roles.map((r) => r.role.code);
    const afterCodes = roles.map((r) => r.code);

    if (actor.userId === id && beforeCodes.includes('SUPER_ADMIN') && !afterCodes.includes('SUPER_ADMIN')) {
      throw new BadRequestException('You cannot remove your own Super Admin role.');
    }
    if (beforeCodes.includes('SUPER_ADMIN') && !afterCodes.includes('SUPER_ADMIN')) await this.assertNotLastSuperAdmin(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({ data: roles.map((r) => ({ userId: id, roleId: r.id, assignedById: actor.userId })) });
      await tx.user.update({ where: { id }, data: { updatedById: actor.userId } });
      await this.audit.record({
        tx, actor, meta, action: 'users.roles.set', resourceType: 'user', resourceId: id,
        before: { roles: beforeCodes }, after: { roles: afterCodes },
      });
      return tx.user.findUniqueOrThrow({ where: { id }, include: userInclude });
    });
    this.auth.invalidateUser(id);
    return this.toSummary(updated);
  }

  async changeStatus(actor: Principal, id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED', reason: string, meta: RequestMeta): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    if (!user) throw new NotFoundException('User not found.');
    if (actor.userId === id && status !== 'ACTIVE') throw new BadRequestException('You cannot suspend or disable your own account.');
    if (user.status === UserStatus.INVITED && status === 'ACTIVE') {
      throw new BadRequestException('Invited users become active by accepting their invitation.');
    }
    if (status !== 'ACTIVE' && user.roles.some((r) => r.role.code === 'SUPER_ADMIN')) await this.assertNotLastSuperAdmin(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id }, data: { status, updatedById: actor.userId }, include: userInclude });
      await this.audit.record({
        tx, actor, meta, action: `users.status.${status.toLowerCase()}`, resourceType: 'user', resourceId: id,
        before: { status: user.status }, after: { status }, metadata: { reason },
      });
      return u;
    });
    if (status !== 'ACTIVE') await this.auth.revokeAllSessions(actor, id, `status_${status.toLowerCase()}`, meta);
    return this.toSummary(updated);
  }

  listSessions(id: string) {
    return this.auth.listSessions(id, null);
  }

  revokeAllSessions(actor: Principal, id: string, meta: RequestMeta) {
    return this.auth.revokeAllSessions(actor, id, 'admin_revoked_all', meta);
  }

  // ----------------------------------------------------------- helpers

  private async resolveRoles(codes: string[]) {
    const unique = [...new Set(codes)];
    const roles = await this.prisma.role.findMany({ where: { code: { in: unique } } });
    if (roles.length !== unique.length) {
      const found = new Set(roles.map((r) => r.code));
      throw new BadRequestException(`Unknown role(s): ${unique.filter((c) => !found.has(c)).join(', ')}`);
    }
    return roles;
  }

  private async validateRefs(departmentId?: string | null, managerId?: string | null) {
    if (departmentId) {
      const d = await this.prisma.department.findUnique({ where: { id: departmentId } });
      if (!d) throw new BadRequestException('Department not found.');
    }
    if (managerId) {
      const m = await this.prisma.user.findUnique({ where: { id: managerId } });
      if (!m) throw new BadRequestException('Manager not found.');
    }
  }

  private async assertNotLastSuperAdmin(excludingUserId: string) {
    const others = await this.prisma.user.count({
      where: { id: { not: excludingUserId }, status: UserStatus.ACTIVE, roles: { some: { role: { code: 'SUPER_ADMIN' } } } },
    });
    if (others === 0) throw new BadRequestException('At least one other active Super Admin must remain.');
  }
}

function pick(obj: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}
