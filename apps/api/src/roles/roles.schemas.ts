import { z } from 'zod';

export const createRoleSchema = z
  .object({
    code: z.string().trim().min(3).max(40).regex(/^[A-Z0-9_]+$/, 'Use upper-case letters, digits and underscores'),
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional(),
    permissions: z.array(z.string().trim().min(3).max(60)).max(200).default([]),
  })
  .strict();
export type CreateRoleDto = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z
  .object({ name: z.string().trim().min(2).max(80).optional(), description: z.string().trim().max(500).nullable().optional() })
  .strict();
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

export const setPermissionsSchema = z.object({ permissions: z.array(z.string().trim().min(3).max(60)).max(200) }).strict();
export type SetPermissionsDto = z.infer<typeof setPermissionsSchema>;
