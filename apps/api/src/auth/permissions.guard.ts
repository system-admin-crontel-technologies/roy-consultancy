import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { PermissionCode } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import { PERMISSIONS_KEY } from '../common/decorators/permissions.decorator.js';
import { requestMeta } from '../common/decorators/request-meta.decorator.js';
import { hasPermission } from './principal.js';

/** Enforces @RequirePermissions on every handler; denied attempts are audited. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionCode[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const principal = req.principal;
    if (!principal) return false;

    const missing = required.filter((p) => !hasPermission(principal, p));
    if (missing.length === 0) return true;

    await this.audit.record({
      actor: principal,
      action: 'authz.denied',
      resourceType: 'route',
      resourceId: `${req.method} ${req.path}`,
      outcome: 'DENIED',
      meta: requestMeta(req),
      metadata: { missing },
    });
    throw new ForbiddenException('You do not have permission to perform this action.');
  }
}
