import { z } from 'zod';
import { paginationSchema } from '../common/utils/pagination.js';

const code = z.string().trim().min(2).max(40).regex(/^[A-Z0-9_-]+$/, 'Use upper-case letters, digits, underscore or dash');
const key = z.string().trim().min(1).max(60).regex(/^[a-z0-9_-]+$/, 'Use lower-case letters, digits, underscore or dash');

export const categorySchema = z
  .object({
    code,
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export type CategoryDto = z.infer<typeof categorySchema>;
export const updateCategorySchema = categorySchema.partial().strict();
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export const serviceListQuerySchema = paginationSchema
  .extend({
    q: z.string().trim().max(120).optional(),
    categoryId: z.string().uuid().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'RETIRED']).optional(),
  })
  .strict();
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;

export const checklistItemSchema = z
  .object({
    key,
    label: z.string().trim().min(1).max(200),
    required: z.boolean().default(true),
    conditional: z.string().trim().max(300).optional(),
    sensitivity: z.enum(['GENERAL', 'SENSITIVE']).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export const taskTemplateItemSchema = z
  .object({
    key,
    title: z.string().trim().min(1).max(200),
    role: z.string().trim().min(1).max(60),
    dependsOn: z.array(key).max(20).optional(),
    targetDays: z.number().int().min(0).max(365).optional(),
    reviewerGate: z.boolean().optional(),
  })
  .strict();

const labelledSchema = z.object({ key, label: z.string().trim().min(1).max(200) }).strict();

function uniqueKeys<T extends { key: string }>(items: T[]) {
  return new Set(items.map((i) => i.key)).size === items.length;
}

export const versionContentSchema = z
  .object({
    effectiveFrom: z.coerce.date(),
    summary: z.string().trim().max(2000).nullable().optional(),
    eligibilityNotes: z.string().trim().max(4000).nullable().optional(),
    exclusions: z.string().trim().max(4000).nullable().optional(),
    jurisdiction: z.string().trim().max(120).nullable().optional(),
    expectedTurnaroundDays: z.number().int().min(0).max(730).nullable().optional(),
    billingType: z.enum(['ONE_TIME', 'RECURRING', 'ANNUAL_PACKAGE']).optional(),
    recurrenceMonths: z.number().int().min(1).max(60).nullable().optional(),
    requiredInputs: z.array(checklistItemSchema).max(100).refine(uniqueKeys, 'Duplicate keys').optional(),
    requiredDocuments: z.array(checklistItemSchema).max(100).refine(uniqueKeys, 'Duplicate keys').optional(),
    taskTemplate: z
      .array(taskTemplateItemSchema)
      .max(100)
      .refine(uniqueKeys, 'Duplicate keys')
      .refine((items) => {
        const keys = new Set(items.map((i) => i.key));
        return items.every((i) => (i.dependsOn ?? []).every((d) => keys.has(d) && d !== i.key));
      }, 'Task dependencies must reference other task keys in the same template')
      .optional(),
    deliverables: z.array(labelledSchema).max(50).refine(uniqueKeys, 'Duplicate keys').optional(),
    closureCriteria: z.array(labelledSchema).max(50).refine(uniqueKeys, 'Duplicate keys').optional(),
  })
  .strict();
export type VersionContentDto = z.infer<typeof versionContentSchema>;

export const priceSchema = z
  .object({
    currency: z.string().length(3).toUpperCase().default('INR'),
    professionalFeeMinor: z.number().int().min(0).max(2_000_000_000),
    governmentFeeMinor: z.number().int().min(0).max(2_000_000_000).default(0),
    thirdPartyChargesMinor: z.number().int().min(0).max(2_000_000_000).default(0),
    taxRateBps: z.number().int().min(0).max(10_000).default(0),
    taxConfigRef: z.string().trim().max(60).nullable().optional(),
    governmentFeeIsEstimate: z.boolean().default(true),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();
export type PriceDto = z.infer<typeof priceSchema>;

export const createServiceSchema = z
  .object({
    code,
    name: z.string().trim().min(2).max(160),
    categoryId: z.string().uuid(),
    shortDescription: z.string().trim().max(500).nullable().optional(),
    ownerUserId: z.string().uuid().nullable().optional(),
    reviewCadenceDays: z.number().int().min(7).max(730).nullable().optional(),
    initialVersion: versionContentSchema.optional(),
    price: priceSchema.optional(),
  })
  .strict();
export type CreateServiceDto = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    categoryId: z.string().uuid().optional(),
    shortDescription: z.string().trim().max(500).nullable().optional(),
    ownerUserId: z.string().uuid().nullable().optional(),
    reviewCadenceDays: z.number().int().min(7).max(730).nullable().optional(),
  })
  .strict();
export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;

export const serviceStatusSchema = z
  .object({ status: z.enum(['ACTIVE', 'PAUSED', 'RETIRED']), reason: z.string().trim().max(500).optional() })
  .strict();
export type ServiceStatusDto = z.infer<typeof serviceStatusSchema>;
