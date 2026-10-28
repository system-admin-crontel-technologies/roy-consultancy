import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@roy/types';

export const PERMISSIONS_KEY = 'requiredPermissions';
/** Every listed permission must be held by the caller. */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
