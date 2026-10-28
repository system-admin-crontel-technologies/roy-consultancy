import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Paginated, WebsiteEnquiry } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { paginated, skipTake } from '../common/utils/pagination.js';
import type { Prisma } from '../generated/prisma/client.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { normalisePhone, type CreateEnquiryDto, type EnquiryQuery, type UpdateEnquiryDto } from './enquiries.schemas.js';

@Injectable()
export class EnquiriesService {
  private readonly logger = new Logger(EnquiriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
  ) {}

  /** Public submission from the marketing site. Stores the enquiry and notifies the office inbox. */
  async submit(dto: CreateEnquiryDto, meta: RequestMeta): Promise<{ id: string; receivedAt: string }> {
    if (dto.website) {
      // Honeypot tripped: pretend success so bots learn nothing, but store nothing.
      this.logger.warn({ msg: 'enquiry honeypot tripped', ip: meta.ipAddress });
      return { id: '00000000-0000-0000-0000-000000000000', receivedAt: new Date().toISOString() };
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.websiteEnquiry.create({
        data: {
          name: dto.name,
          phone: normalisePhone(dto.phone),
          email: dto.email || null,
          service: dto.service,
          message: dto.message || null,
          sourcePage: dto.sourcePage ?? null,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          correlationId: meta.correlationId,
        },
      });
      await this.audit.record({ tx, actor: { system: 'website' }, meta, action: 'enquiries.submit', resourceType: 'website_enquiry', resourceId: created.id, after: { service: created.service, sourcePage: created.sourcePage } });
      return created;
    });

    // The enquiry is already stored; a notification failure must not turn into an error for the visitor.
    try {
      const org = await this.settings.getOrganisation();
      const to = org.notificationReplyTo || org.email;
      if (to) {
        await this.mail.sendEnquiryNotification({ to, enquiry: { id: row.id, name: row.name, phone: row.phone, email: row.email, service: row.service, message: row.message, sourcePage: row.sourcePage } }, `enquiry-${row.id}`);
      } else {
        this.logger.warn({ msg: 'enquiry received but no organisation email configured; set it under Settings', id: row.id });
      }
    } catch (err) {
      this.logger.error({ msg: 'enquiry notification failed', id: row.id, err: (err as Error).message });
    }
    return { id: row.id, receivedAt: row.createdAt.toISOString() };
  }

  async list(q: EnquiryQuery): Promise<Paginated<WebsiteEnquiry>> {
    const where: Prisma.WebsiteEnquiryWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.service ? { service: q.service } : {}),
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { phone: { contains: q.q.replace(/[\s-]/g, '') } },
              { email: { contains: q.q, mode: 'insensitive' } },
              { message: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.websiteEnquiry.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) }),
      this.prisma.websiteEnquiry.count({ where }),
    ]);
    return paginated(items.map(toSummary), total, q);
  }

  async get(id: string): Promise<WebsiteEnquiry> {
    const row = await this.prisma.websiteEnquiry.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Enquiry not found.');
    return toSummary(row);
  }

  async update(actor: Principal, id: string, dto: UpdateEnquiryDto, meta: RequestMeta): Promise<WebsiteEnquiry> {
    const before = await this.prisma.websiteEnquiry.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Enquiry not found.');
    const statusChanged = dto.status !== undefined && dto.status !== before.status;
    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.websiteEnquiry.update({
        where: { id },
        data: {
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(statusChanged ? { handledById: actor.userId, handledAt: new Date() } : {}),
        },
      });
      await this.audit.record({ tx, actor, meta, action: 'enquiries.update', resourceType: 'website_enquiry', resourceId: id, before: { status: before.status, notes: before.notes }, after: { status: r.status, notes: r.notes } });
      return r;
    });
    return toSummary(updated);
  }

  async counts(): Promise<{ total: number; new: number }> {
    const [total, fresh] = await Promise.all([this.prisma.websiteEnquiry.count(), this.prisma.websiteEnquiry.count({ where: { status: 'NEW' } })]);
    return { total, new: fresh };
  }
}

function toSummary(r: Prisma.WebsiteEnquiryGetPayload<object>): WebsiteEnquiry {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    service: r.service,
    message: r.message,
    status: r.status,
    sourcePage: r.sourcePage,
    notes: r.notes,
    handledById: r.handledById,
    handledAt: r.handledAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
