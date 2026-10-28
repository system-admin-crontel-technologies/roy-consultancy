import { z } from 'zod';

/** Accept any zone the runtime can format with (covers canonical names such as Asia/Kolkata that supportedValuesOf omits on some ICU builds). */
function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const organisationSettingsSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    legalName: z.string().trim().max(200).default(''),
    email: z.string().trim().email().or(z.literal('')).default(''),
    phone: z.string().trim().max(32).default(''),
    addressLines: z.array(z.string().trim().max(120)).max(6).default([]),
    timezone: z.string().refine(isValidTimezone, 'Unknown IANA timezone'),
    currency: z.string().length(3).toUpperCase(),
    dateFormat: z.enum(['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'DD MMM YYYY']),
    financialYearStartMonth: z.number().int().min(1).max(12),
    gstin: z.string().trim().max(15).default(''),
    notificationFromName: z.string().trim().max(80).default(''),
    notificationReplyTo: z.string().trim().email().or(z.literal('')).default(''),
    reminderDaysBeforeDue: z.array(z.number().int().min(0).max(365)).max(10).default([30, 7, 1]),
  })
  .strict();
export type OrganisationSettingsDto = z.infer<typeof organisationSettingsSchema>;

export const updateSequenceSchema = z
  .object({
    label: z.string().trim().min(2).max(80).optional(),
    prefix: z.string().trim().min(0).max(12).regex(/^[A-Z0-9\-/]*$/, 'Use upper-case letters, digits, dash or slash').optional(),
    padding: z.number().int().min(3).max(10).optional(),
    resetPolicy: z.enum(['NEVER', 'CALENDAR_YEAR', 'FINANCIAL_YEAR']).optional(),
    /** May only move forward; lowering a sequence could create duplicate reference numbers. */
    nextValue: z.number().int().min(1).optional(),
  })
  .strict();
export type UpdateSequenceDto = z.infer<typeof updateSequenceSchema>;
