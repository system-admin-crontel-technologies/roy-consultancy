import { z } from 'zod';
import { paginationSchema } from '../common/utils/pagination.js';

/** Service chips offered on the public contact form. Keep in sync with apps/web site content. */
export const ENQUIRY_SERVICES = ['Incorporation', 'ROC filing', 'GST', 'Trademark', 'Income tax', 'Other'] as const;

/** Indian mobile numbers: optional +91 / 0 prefix, then 10 digits starting 6-9. Spaces and dashes tolerated. */
export const INDIAN_PHONE_RE = /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/;

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[\s-]/g, '');
  const m = /^(?:\+?91|0)?([6-9]\d{9})$/.exec(digits);
  return m ? `+91${m[1]}` : digits;
}

export const createEnquirySchema = z
  .object({
    name: z.string().trim().min(2, 'Please add your name.').max(120),
    phone: z
      .string()
      .trim()
      .min(10, 'Please add your phone number.')
      .max(20)
      .refine((v) => INDIAN_PHONE_RE.test(v.replace(/[\s-]/g, '')), 'Enter a valid Indian mobile number.'),
    email: z.string().trim().email().max(254).optional().or(z.literal('')),
    service: z.enum(ENQUIRY_SERVICES),
    message: z.string().trim().max(2000).optional().or(z.literal('')),
    sourcePage: z.string().trim().max(200).optional(),
    /** Honeypot. Bots fill it; humans never see it. */
    website: z.string().max(200).optional(),
  })
  .strict();
export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;

export const enquiryQuerySchema = paginationSchema.extend({
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']).optional(),
  service: z.enum(ENQUIRY_SERVICES).optional(),
  q: z.string().trim().max(120).optional(),
});
export type EnquiryQuery = z.infer<typeof enquiryQuerySchema>;

export const updateEnquirySchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']).optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .strict();
export type UpdateEnquiryDto = z.infer<typeof updateEnquirySchema>;
