import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { AuthUser, PermissionCode } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { generateOpaqueToken, hashToken } from '../common/utils/tokens.js';
import type { Env } from '../config/env.js';
import { AuthEventType, SessionClient, UserStatus, UserTokenType } from '../generated/prisma/enums.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import type { Principal } from './principal.js';
import { TokenService } from './token.service.js';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
/** Role/permission and session changes propagate within this window (SRS Module 1 acceptance). */
const PRINCIPAL_CACHE_MS = 30_000;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresAt: Date;
  sessionId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly principalCache = new Map<string, { value: Principal | null; expires: number }>();
  private readonly refreshTtl: number;
  private readonly inviteTtl: number;
  private readonly resetTtl: number;
  private readonly siteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    config: ConfigService<Env, true>,
  ) {
    this.refreshTtl = config.get('REFRESH_TOKEN_TTL_SECONDS', { infer: true });
    this.inviteTtl = config.get('INVITE_TOKEN_TTL_SECONDS', { infer: true });
    this.resetTtl = config.get('PASSWORD_RESET_TTL_SECONDS', { infer: true });
    this.siteUrl = config.get('NEXT_PUBLIC_SITE_URL', { infer: true });
  }

  // ---------------------------------------------------------------- login

  async login(email: string, password: string, client: SessionClient, meta: RequestMeta) {
    const user = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    const fail = async (reason: string, userId?: string) => {
      await this.prisma.authEvent.create({
        data: { userId, email, type: AuthEventType.LOGIN_FAILED, ipAddress: meta.ipAddress, userAgent: meta.userAgent, metadata: { reason } },
      });
      throw new UnauthorizedException('Invalid email or password.');
    };

    if (!user) return fail('unknown_user');
    if (user.lockedUntil && user.lockedUntil > new Date()) return fail('locked', user.id);
    if (user.status !== UserStatus.ACTIVE) return fail(`status_${user.status.toLowerCase()}`, user.id);

    const ok = await this.passwords.verify(user.passwordHash, password);
    if (!ok) {
      const failed = user.failedLoginCount + 1;
      const lock = failed >= MAX_FAILED_LOGINS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null },
      });
      if (lock) {
        await this.prisma.authEvent.create({
          data: { userId: user.id, email, type: AuthEventType.ACCOUNT_LOCKED, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
        });
      }
      return fail('bad_password', user.id);
    }

    const issued = await this.issueSession(user.id, client, meta);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    });
    await this.prisma.authEvent.create({
      data: { userId: user.id, email, type: AuthEventType.LOGIN_SUCCESS, ipAddress: meta.ipAddress, userAgent: meta.userAgent, metadata: { client } },
    });
    const principal = (await this.resolvePrincipal(issued.sessionId, true))!;
    return { issued, user: this.toAuthUser(principal) };
  }

  private async issueSession(userId: string, client: SessionClient, meta: RequestMeta, familyId: string = randomUUID()): Promise<IssuedTokens> {
    const refreshToken = generateOpaqueToken();
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtl * 1000);
    const session = await this.prisma.session.create({
      data: {
        userId,
        familyId,
        client,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: refreshExpiresAt,
      },
    });
    const accessToken = await this.tokens.signAccessToken({ sub: userId, sid: session.id });
    return { accessToken, refreshToken, accessExpiresIn: this.tokens.accessTtlSeconds, refreshExpiresAt, sessionId: session.id };
  }

  // -------------------------------------------------------------- refresh

  async refresh(refreshToken: string, meta: RequestMeta) {
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: hashToken(refreshToken) } });
    if (!session) throw new UnauthorizedException('Session is not valid.');

    if (session.revokedAt) {
      // Reuse of a rotated token: assume theft and revoke the whole family.
      await this.prisma.session.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'refresh_token_reuse' },
      });
      await this.prisma.authEvent.create({
        data: { userId: session.userId, type: AuthEventType.REFRESH_REUSE_DETECTED, ipAddress: meta.ipAddress, userAgent: meta.userAgent, metadata: { familyId: session.familyId } },
      });
      this.invalidateUser(session.userId);
      throw new UnauthorizedException('Session is not valid.');
    }
    if (session.expiresAt <= new Date()) throw new UnauthorizedException('Session has expired.');

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('Account is not active.');

    const issued = await this.prisma.$transaction(async () => {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), revokedReason: 'rotated' },
      });
      return this.issueSession(user.id, session.client, meta, session.familyId);
    });
    this.principalCache.delete(session.id);
    await this.prisma.authEvent.create({
      data: { userId: user.id, email: user.email, type: AuthEventType.TOKEN_REFRESHED, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
    const principal = (await this.resolvePrincipal(issued.sessionId, true))!;
    return { issued, user: this.toAuthUser(principal) };
  }

  // --------------------------------------------------------------- logout

  async logout(principal: Principal, meta: RequestMeta) {
    await this.prisma.session.updateMany({
      where: { id: principal.sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'logout' },
    });
    this.principalCache.delete(principal.sessionId);
    await this.prisma.authEvent.create({
      data: { userId: principal.userId, email: principal.email, type: AuthEventType.LOGOUT, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
  }

  async listSessions(userId: string, currentSessionId: string | null) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });
    return sessions.map((s) => ({
      id: s.id,
      client: s.client,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      current: s.id === currentSessionId,
    }));
  }

  async revokeSession(actor: Principal, userId: string, sessionId: string, meta: RequestMeta) {
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: actor.userId === userId ? 'user_revoked' : 'admin_revoked' },
    });
    if (result.count === 0) throw new BadRequestException('Session not found or already revoked.');
    this.principalCache.delete(sessionId);
    await this.prisma.authEvent.create({
      data: { userId, type: AuthEventType.SESSION_REVOKED, ipAddress: meta.ipAddress, userAgent: meta.userAgent, metadata: { sessionId, by: actor.userId } },
    });
    await this.audit.record({ actor, action: 'auth.session.revoke', resourceType: 'session', resourceId: sessionId, meta, metadata: { userId } });
  }

  async revokeAllSessions(actor: Principal | null, userId: string, reason: string, meta: RequestMeta, keepSessionId?: string) {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, ...(keepSessionId ? { id: { not: keepSessionId } } : {}) },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    this.invalidateUser(userId);
    await this.prisma.authEvent.create({
      data: { userId, type: AuthEventType.ALL_SESSIONS_REVOKED, ipAddress: meta.ipAddress, userAgent: meta.userAgent, metadata: { reason, count: result.count, by: actor?.userId ?? 'system' } },
    });
    if (actor) {
      await this.audit.record({ actor, action: 'auth.sessions.revoke_all', resourceType: 'user', resourceId: userId, meta, metadata: { reason, count: result.count } });
    }
    return result.count;
  }

  // ------------------------------------------------------ password reset

  async requestPasswordReset(email: string, meta: RequestMeta) {
    const user = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    // Always respond identically so that email enumeration is not possible.
    if (!user || user.status === UserStatus.DISABLED) return;
    const token = generateOpaqueToken();
    await this.prisma.userToken.updateMany({
      where: { userId: user.id, type: UserTokenType.PASSWORD_RESET, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.prisma.userToken.create({
      data: { userId: user.id, type: UserTokenType.PASSWORD_RESET, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + this.resetTtl * 1000) },
    });
    await this.prisma.authEvent.create({
      data: { userId: user.id, email: user.email, type: AuthEventType.PASSWORD_RESET_REQUESTED, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
    await this.mail.sendPasswordReset({
      to: user.email,
      name: user.fullName,
      link: `${this.siteUrl}/admin/reset-password?token=${encodeURIComponent(token)}`,
      expiresInMinutes: Math.round(this.resetTtl / 60),
    });
  }

  async confirmPasswordReset(token: string, password: string, meta: RequestMeta) {
    const record = await this.consumeToken(token, UserTokenType.PASSWORD_RESET);
    const hash = await this.passwords.hash(password);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: hash, passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    });
    await this.revokeAllSessions(null, record.userId, 'password_reset', meta);
    await this.prisma.authEvent.create({
      data: { userId: record.userId, type: AuthEventType.PASSWORD_RESET_COMPLETED, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
  }

  async changePassword(principal: Principal, currentPassword: string, newPassword: string, meta: RequestMeta) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: principal.userId } });
    if (!(await this.passwords.verify(user.passwordHash, currentPassword))) {
      throw new BadRequestException('Current password is incorrect.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await this.passwords.hash(newPassword), passwordChangedAt: new Date() },
    });
    await this.revokeAllSessions(null, user.id, 'password_changed', meta, principal.sessionId);
    await this.prisma.authEvent.create({
      data: { userId: user.id, email: user.email, type: AuthEventType.PASSWORD_CHANGED, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
  }

  // ---------------------------------------------------------- invitations

  /** Creates an invite token and emails it. Called by UsersService after creating an INVITED user. */
  async sendInvitation(userId: string, invitedByName: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.status !== UserStatus.INVITED) throw new BadRequestException('Only invited users can receive an invitation.');
    const token = generateOpaqueToken();
    await this.prisma.userToken.updateMany({
      where: { userId, type: UserTokenType.INVITE, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.prisma.userToken.create({
      data: { userId, type: UserTokenType.INVITE, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + this.inviteTtl * 1000) },
    });
    await this.prisma.authEvent.create({ data: { userId, email: user.email, type: AuthEventType.INVITE_SENT } });
    await this.mail.sendInvitation({
      to: user.email,
      name: user.fullName,
      invitedBy: invitedByName,
      link: `${this.siteUrl}/admin/accept-invite?token=${encodeURIComponent(token)}`,
      expiresInHours: Math.round(this.inviteTtl / 3600),
    });
  }

  async inspectInvite(token: string) {
    const record = await this.prisma.userToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { email: true, fullName: true, status: true } } },
    });
    if (!record || record.type !== UserTokenType.INVITE || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException('This invitation link is invalid or has expired.');
    }
    return { email: record.user.email, fullName: record.user.fullName, expiresAt: record.expiresAt };
  }

  async acceptInvite(dto: { token: string; password: string; fullName?: string }, meta: RequestMeta) {
    const record = await this.consumeToken(dto.token, UserTokenType.INVITE);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: record.userId } });
    if (user.status !== UserStatus.INVITED) throw new BadRequestException('This invitation has already been used.');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await this.passwords.hash(dto.password),
        passwordChangedAt: new Date(),
        status: UserStatus.ACTIVE,
        ...(dto.fullName ? { fullName: dto.fullName } : {}),
      },
    });
    await this.prisma.authEvent.create({
      data: { userId: user.id, email: user.email, type: AuthEventType.INVITE_ACCEPTED, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
  }

  private async consumeToken(token: string, type: UserTokenType) {
    const record = await this.prisma.userToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== type || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException('This link is invalid or has expired.');
    }
    await this.prisma.userToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return record;
  }

  // ------------------------------------------------------------ principal

  /** Resolves and caches the principal for a session. Returns null if the session or user is no longer valid. */
  async resolvePrincipal(sessionId: string, fresh = false): Promise<Principal | null> {
    const cached = this.principalCache.get(sessionId);
    if (!fresh && cached && cached.expires > Date.now()) return cached.value;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        },
      },
    });
    let value: Principal | null = null;
    if (session && !session.revokedAt && session.expiresAt > new Date() && session.user.status === UserStatus.ACTIVE) {
      const roles = session.user.roles.map((r) => r.role.code);
      const permissions = new Set<PermissionCode>();
      for (const ur of session.user.roles) for (const rp of ur.role.permissions) permissions.add(rp.permission.code as PermissionCode);
      value = {
        userId: session.user.id,
        sessionId: session.id,
        email: session.user.email,
        fullName: session.user.fullName,
        roles,
        permissions,
        isSuperAdmin: roles.includes('SUPER_ADMIN'),
      };
      // Touch lastUsedAt at most once per cache window.
      await this.prisma.session.update({ where: { id: sessionId }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
    }
    this.principalCache.set(sessionId, { value, expires: Date.now() + PRINCIPAL_CACHE_MS });
    return value;
  }

  /** Drops cached principals for a user so role/status changes apply immediately. */
  invalidateUser(userId: string) {
    for (const [sid, entry] of this.principalCache) if (entry.value?.userId === userId) this.principalCache.delete(sid);
  }

  async me(principal: Principal): Promise<AuthUser> {
    const fresh = await this.resolvePrincipal(principal.sessionId, true);
    if (!fresh) throw new ForbiddenException('Session is no longer valid.');
    return this.toAuthUser(fresh);
  }

  private toAuthUser(p: Principal): AuthUser {
    return {
      id: p.userId,
      email: p.email,
      fullName: p.fullName,
      status: 'ACTIVE',
      roles: p.roles,
      permissions: p.isSuperAdmin ? ['*'] : [...p.permissions],
      mfaEnabled: false,
      lastLoginAt: null,
    };
  }
}
