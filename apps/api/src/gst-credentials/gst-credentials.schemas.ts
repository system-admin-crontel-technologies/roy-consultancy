import { z } from 'zod';
import { paginationSchema } from '../common/utils/pagination.js';

const clientName = z.string().trim().min(1, 'Client name is required.').max(200);
const username = z.string().trim().min(1, 'User ID is required.').max(100);
// Passwords are stored exactly as typed (no trimming): portal passwords can legitimately contain any character.
const password = z.string().min(1, 'Password is required.').max(200);

export const createGstCredentialSchema = z.object({ clientName, username, password }).strict();
export type CreateGstCredentialDto = z.infer<typeof createGstCredentialSchema>;

export const updateGstCredentialSchema = z
  .object({ clientName: clientName.optional(), username: username.optional(), password: password.optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');
export type UpdateGstCredentialDto = z.infer<typeof updateGstCredentialSchema>;

export const gstCredentialQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
});
export type GstCredentialQuery = z.infer<typeof gstCredentialQuerySchema>;
