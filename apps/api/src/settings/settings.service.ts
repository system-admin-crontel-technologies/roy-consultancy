import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { NumberingSequenceSummary, OrganisationSettings } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { organisationSettingsSchema, type OrganisationSettingsDto, type UpdateSequenceDto } from './settings.schemas.js';

export const ORG_SETTINGS_KEY = 'organisation';

export const DEFAULT_ORG_SETTINGS: OrganisationSettings = {
  name: 'Roy Consultancy',
  legalName: '',
  email: '',
  phone: '',
  addressLines: [],
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  financialYearStartMonth: 4,
  gstin: '',
  notificationFromName: 'Roy Consultancy',
  notificationReplyTo: '',
  reminderDaysBeforeDue: [30, 7, 1],
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getOrganisation(): Promise<OrganisationSettings> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key: ORG_SETTINGS_KEY } });
    if (!row) return DEFAULT_ORG_SETTINGS;
    const parsed = organisationSettingsSchema.safeParse(row.value);
    return parsed.success ? parsed.data : { ...DEFAULT_ORG_SETTINGS, ...(row.value as object) };
  }

  async updateOrganisation(actor: Principal, dto: OrganisationSettingsDto, meta: RequestMeta): Promise<OrganisationSettings> {
    const before = await this.getOrganisation();
    await this.prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: ORG_SETTINGS_KEY },
        create: { key: ORG_SETTINGS_KEY, value: dto as Prisma.InputJsonValue, description: 'Organisation profile and localisation', updatedById: actor.userId },
        update: { value: dto as Prisma.InputJsonValue, updatedById: actor.userId },
      });
      await this.audit.record({ tx, actor, meta, action: 'settings.organisation.update', resourceType: 'system_setting', resourceId: ORG_SETTINGS_KEY, before, after: dto });
    });
    return dto;
  }

  // ------------------------------------------------------- sequences

  private preview(s: { prefix: string; padding: number; nextValue: number; resetPolicy: string; periodKey: string | null }) {
    const period = s.resetPolicy === 'NEVER' ? '' : `${s.periodKey ?? currentPeriodKey(s.resetPolicy)}/`;
    return `${s.prefix}${s.prefix && !s.prefix.endsWith('/') && !s.prefix.endsWith('-') ? '-' : ''}${period}${String(s.nextValue).padStart(s.padding, '0')}`;
  }

  async listSequences(): Promise<NumberingSequenceSummary[]> {
    const rows = await this.prisma.numberingSequence.findMany({ orderBy: { key: 'asc' } });
    return rows.map((s) => ({ ...s, updatedAt: undefined, updatedById: undefined, preview: this.preview(s) }) as unknown as NumberingSequenceSummary);
  }

  async updateSequence(actor: Principal, key: string, dto: UpdateSequenceDto, meta: RequestMeta): Promise<NumberingSequenceSummary> {
    const before = await this.prisma.numberingSequence.findUnique({ where: { key } });
    if (!before) throw new NotFoundException('Sequence not found.');
    if (dto.nextValue !== undefined && dto.nextValue < before.nextValue) {
      throw new BadRequestException(`nextValue cannot be lower than the current value (${before.nextValue}).`);
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.numberingSequence.update({ where: { key }, data: { ...dto, updatedById: actor.userId } });
      await this.audit.record({ tx, actor, meta, action: 'settings.sequence.update', resourceType: 'numbering_sequence', resourceId: key, before, after: s });
      return s;
    });
    return { ...updated, preview: this.preview(updated) } as unknown as NumberingSequenceSummary;
  }

  /**
   * Allocates the next reference number atomically. Used by later modules (cases, invoices...).
   * Must be called inside the caller's transaction so a rolled-back record does not burn a number
   * unless the business explicitly accepts gaps.
   */
  async nextReference(tx: Prisma.TransactionClient, key: string): Promise<string> {
    const rows = await tx.$queryRaw<{ key: string; prefix: string; padding: number; nextValue: number; resetPolicy: string; periodKey: string | null }[]>`
      SELECT "key", "prefix", "padding", "nextValue", "resetPolicy"::text AS "resetPolicy", "periodKey"
      FROM "numbering_sequences" WHERE "key" = ${key} FOR UPDATE`;
    const seq = rows[0];
    if (!seq) throw new Error(`Numbering sequence ${key} is not configured`);
    const period = seq.resetPolicy === 'NEVER' ? null : currentPeriodKey(seq.resetPolicy);
    let value = seq.nextValue;
    if (period && seq.periodKey !== period) value = 1;
    await tx.numberingSequence.update({ where: { key }, data: { nextValue: value + 1, periodKey: period } });
    return this.preview({ ...seq, nextValue: value, periodKey: period });
  }
}

/** Period label for yearly-reset sequences, e.g. 2026 or 2026-27 for an Indian financial year. */
export function currentPeriodKey(policy: string, now = new Date()): string {
  const y = now.getFullYear();
  if (policy === 'FINANCIAL_YEAR') {
    const fyStart = now.getMonth() + 1 >= 4 ? y : y - 1;
    return `${fyStart}-${String((fyStart + 1) % 100).padStart(2, '0')}`;
  }
  return String(y);
}
