import { z } from 'zod';

export const updateIntegrationSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    provider: z.string().trim().max(80).nullable().optional(),
    status: z.enum(['NOT_CONFIGURED', 'ACTIVE', 'DISABLED']).optional(),
    /** Non-secret configuration only (endpoints, sender ids, bucket names). Secrets live in the secret store. */
    config: z.record(z.string(), z.union([z.string().max(500), z.number(), z.boolean()])).optional(),
    secretRef: z.string().trim().max(120).nullable().optional(),
  })
  .strict()
  .refine((v) => !v.config || !Object.keys(v.config).some((k) => /(secret|password|token|key)$/i.test(k) && !/^(bucket|public|access)/i.test(k)), {
    message: 'Secrets must not be stored in config; reference them via secretRef instead.',
  });
export type UpdateIntegrationDto = z.infer<typeof updateIntegrationSchema>;
