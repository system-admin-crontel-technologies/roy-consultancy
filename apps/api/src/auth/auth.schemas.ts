import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
    message: 'Password must contain upper-case, lower-case and numeric characters',
  });

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
    client: z.enum(['WEB', 'MOBILE']).default('WEB'),
  })
  .strict();
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z
  .object({ refreshToken: z.string().min(20).max(512).optional() })
  .strict();
export type RefreshDto = z.infer<typeof refreshSchema>;

export const passwordResetRequestSchema = z.object({ email: emailSchema }).strict();
export type PasswordResetRequestDto = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z
  .object({ token: z.string().min(20).max(512), password: passwordSchema })
  .strict();
export type PasswordResetConfirmDto = z.infer<typeof passwordResetConfirmSchema>;

export const acceptInviteSchema = z
  .object({ token: z.string().min(20).max(512), password: passwordSchema, fullName: z.string().trim().min(2).max(120).optional() })
  .strict();
export type AcceptInviteDto = z.infer<typeof acceptInviteSchema>;

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema })
  .strict();
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const tokenLookupSchema = z.object({ token: z.string().min(20).max(512) }).strict();
