import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import type { Env } from '../config/env.js';
import { SessionClient } from '../generated/prisma/enums.js';
import {
  acceptInviteSchema,
  changePasswordSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  refreshSchema,
  tokenLookupSchema,
  type AcceptInviteDto,
  type ChangePasswordDto,
  type LoginDto,
  type PasswordResetConfirmDto,
  type PasswordResetRequestDto,
  type RefreshDto,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies, type CookieSettings } from './cookies.js';
import type { Principal } from './principal.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieSettings: CookieSettings;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService<Env, true>,
  ) {
    this.cookieSettings = {
      secure: config.get('COOKIE_SECURE', { infer: true }),
      domain: config.get('COOKIE_DOMAIN', { infer: true }),
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(@Body({ schema: loginSchema }) dto: LoginDto, @ReqMeta() meta: RequestMeta, @Res({ passthrough: true }) res: Response) {
    const client = dto.client === 'MOBILE' ? SessionClient.MOBILE : SessionClient.WEB;
    const { issued, user } = await this.auth.login(dto.email, dto.password, client, meta);
    if (client === SessionClient.WEB) {
      setAuthCookies(res, this.cookieSettings, issued);
      return { user, expiresIn: issued.accessExpiresIn };
    }
    return { user, accessToken: issued.accessToken, refreshToken: issued.refreshToken, expiresIn: issued.accessExpiresIn };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  async refresh(
    @Body({ schema: refreshSchema }) dto: RefreshDto,
    @Req() req: Request,
    @ReqMeta() meta: RequestMeta,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const fromCookie = cookies?.[REFRESH_COOKIE];
    const token = dto.refreshToken ?? fromCookie;
    if (!token) {
      clearAuthCookies(res, this.cookieSettings);
      return res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'No refresh token.', correlationId: meta.correlationId });
    }
    try {
      const { issued, user } = await this.auth.refresh(token, meta);
      if (!dto.refreshToken) {
        setAuthCookies(res, this.cookieSettings, issued);
        return { user, expiresIn: issued.accessExpiresIn };
      }
      return { user, accessToken: issued.accessToken, refreshToken: issued.refreshToken, expiresIn: issued.accessExpiresIn };
    } catch (err) {
      clearAuthCookies(res, this.cookieSettings);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(@CurrentUser() principal: Principal, @ReqMeta() meta: RequestMeta, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(principal, meta);
    clearAuthCookies(res, this.cookieSettings);
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user with roles and permissions' })
  me(@CurrentUser() principal: Principal) {
    return this.auth.me(principal);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List my active sessions' })
  sessions(@CurrentUser() principal: Principal) {
    return this.auth.listSessions(principal.userId, principal.sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke one of my sessions' })
  async revokeSession(@CurrentUser() principal: Principal, @Param('id', { schema: z.string().uuid() }) id: string, @ReqMeta() meta: RequestMeta) {
    await this.auth.revokeSession(principal, principal.userId, id, meta);
  }

  @Post('sessions/revoke-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke all my other sessions' })
  async revokeAll(@CurrentUser() principal: Principal, @ReqMeta() meta: RequestMeta) {
    const count = await this.auth.revokeAllSessions(principal, principal.userId, 'user_revoked_all', meta, principal.sessionId);
    return { revoked: count };
  }

  @Post('change-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Change my password (revokes other sessions)' })
  async changePassword(@CurrentUser() principal: Principal, @Body({ schema: changePasswordSchema }) dto: ChangePasswordDto, @ReqMeta() meta: RequestMeta) {
    await this.auth.changePassword(principal, dto.currentPassword, dto.newPassword, meta);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password-reset/request')
  @HttpCode(202)
  @ApiOperation({ summary: 'Request a password reset email (always 202)' })
  async requestReset(@Body({ schema: passwordResetRequestSchema }) dto: PasswordResetRequestDto, @ReqMeta() meta: RequestMeta) {
    await this.auth.requestPasswordReset(dto.email, meta);
    return { accepted: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('password-reset/confirm')
  @HttpCode(204)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  async confirmReset(@Body({ schema: passwordResetConfirmSchema }) dto: PasswordResetConfirmDto, @ReqMeta() meta: RequestMeta) {
    await this.auth.confirmPasswordReset(dto.token, dto.password, meta);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('invitations')
  @ApiOperation({ summary: 'Inspect an invitation token' })
  inspectInvite(@Query({ schema: tokenLookupSchema }) q: { token: string }) {
    return this.auth.inspectInvite(q.token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('invitations/accept')
  @HttpCode(204)
  @ApiOperation({ summary: 'Accept an invitation and set a password' })
  async acceptInvite(@Body({ schema: acceptInviteSchema }) dto: AcceptInviteDto, @ReqMeta() meta: RequestMeta) {
    await this.auth.acceptInvite(dto, meta);
  }
}
