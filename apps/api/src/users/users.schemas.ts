import { z } from 'zod';
import { emailSchema } from '../auth/auth.schemas.js';
import { paginationSchema } from '../common/utils/pagination.js';

export const userListQuerySchema = paginationSchema
  .extend({
    q: z.string().trim().max(120).optional(),
    status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED']).optional(),
    role: z.string().trim().max(60).optional(),
    departmentId: z.string().uuid().optional(),
  })
  .strict();
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const inviteUserSchema = z
  .object({
    email: emailSchema,
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(32).optional(),
    departmentId: z.string().uuid().nullable().optional(),
    managerId: z.string().uuid().nullable().optional(),
    roleCodes: z.array(z.string().trim().min(1).max(60)).min(1).max(10),
  })
  .strict();
export type InviteUserDto = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(32).nullable().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    managerId: z.string().uuid().nullable().optional(),
  })
  .strict();
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const setUserRolesSchema = z.object({ roleCodes: z.array(z.string().trim().min(1).max(60)).max(10) }).strict();
export type SetUserRolesDto = z.infer<typeof setUserRolesSchema>;

export const statusReasonSchema = z.object({ reason: z.string().trim().min(3).max(500) }).strict();
export type StatusReasonDto = z.infer<typeof statusReasonSchema>;

export const departmentSchema = z
  .object({
    code: z.string().trim().min(2).max(20).regex(/^[A-Z0-9_]+$/, 'Use upper-case letters, digits and underscores'),
    name: z.string().trim().min(2).max(80),
    isActive: z.boolean().optional(),
  })
  .strict();
export type DepartmentDto = z.infer<typeof departmentSchema>;
export const updateDepartmentSchema = departmentSchema.partial().strict();
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
