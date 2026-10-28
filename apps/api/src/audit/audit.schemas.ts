import { z } from 'zod';
import { paginationSchema } from '../common/utils/pagination.js';

export const auditQuerySchema = paginationSchema
  .extend({
    actorUserId: z.string().uuid().optional(),
    action: z.string().trim().max(120).optional(),
    resourceType: z.string().trim().max(60).optional(),
    resourceId: z.string().trim().max(120).optional(),
    outcome: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    q: z.string().trim().max(120).optional(),
  })
  .strict();
export type AuditQuery = z.infer<typeof auditQuerySchema>;
