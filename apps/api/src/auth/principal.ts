import type { PermissionCode } from '@roy/types';

/** The authenticated caller, resolved once per request by the AuthGuard. */
export interface Principal {
  userId: string;
  sessionId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: Set<PermissionCode>;
  isSuperAdmin: boolean;
}

export function hasPermission(p: Principal, code: PermissionCode): boolean {
  return p.isSuperAdmin || p.permissions.has(code);
}
