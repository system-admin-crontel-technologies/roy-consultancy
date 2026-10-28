import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ServiceCategorySummary, ServiceSummary, ServiceVersionSummary } from '@roy/types';
import { AuditService } from '../audit/audit.service.js';
import type { Principal } from '../auth/principal.js';
import type { RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { paginated, skipTake } from '../common/utils/pagination.js';
import type { Prisma } from '../generated/prisma/client.js';
import { ServiceStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CategoryDto, CreateServiceDto, PriceDto, ServiceListQuery, ServiceStatusDto, UpdateCategoryDto, UpdateServiceDto, VersionContentDto } from './catalogue.schemas.js';

const versionInclude = { price: true } satisfies Prisma.ServiceVersionInclude;
const serviceInclude = {
  category: { select: { id: true, code: true, name: true } },
  owner: { select: { id: true, fullName: true } },
  versions: { where: { isCurrent: true }, include: versionInclude, take: 1 },
  _count: { select: { versions: true } },
} satisfies Prisma.ServiceInclude;

type VersionRow = Prisma.ServiceVersionGetPayload<{ include: typeof versionInclude }>;
type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof serviceInclude }>;

/** Allowed service status transitions (SRS Module 4). */
const TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  DRAFT: ['ACTIVE', 'RETIRED'],
  ACTIVE: ['PAUSED', 'RETIRED'],
  PAUSED: ['ACTIVE', 'RETIRED'],
  RETIRED: [],
};

@Injectable()
export class CatalogueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------ categories

  async listCategories(): Promise<ServiceCategorySummary[]> {
    const rows = await this.prisma.serviceCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { services: true } } } });
    return rows.map((c) => ({
      id: c.id, code: c.code, name: c.name, description: c.description, parentId: c.parentId,
      sortOrder: c.sortOrder, isActive: c.isActive, isDemo: c.isDemo, serviceCount: c._count.services,
    }));
  }

  async createCategory(actor: Principal, dto: CategoryDto, meta: RequestMeta) {
    if (await this.prisma.serviceCategory.findUnique({ where: { code: dto.code } })) throw new ConflictException('Category code already exists.');
    if (dto.parentId) await this.assertCategory(dto.parentId);
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.serviceCategory.create({ data: { ...dto, isActive: dto.isActive ?? true, sortOrder: dto.sortOrder ?? 0 } });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.category.create', resourceType: 'service_category', resourceId: c.id, after: c });
      return c;
    });
  }

  async updateCategory(actor: Principal, id: string, dto: UpdateCategoryDto, meta: RequestMeta) {
    const before = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Category not found.');
    if (dto.parentId === id) throw new BadRequestException('A category cannot be its own parent.');
    if (dto.parentId) await this.assertCategory(dto.parentId);
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.serviceCategory.update({ where: { id }, data: dto });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.category.update', resourceType: 'service_category', resourceId: id, before, after: c });
      return c;
    });
  }

  private async assertCategory(id: string) {
    if (!(await this.prisma.serviceCategory.findUnique({ where: { id } }))) throw new BadRequestException('Category not found.');
  }

  // -------------------------------------------------------------- services

  private toVersion(v: VersionRow): ServiceVersionSummary {
    return {
      id: v.id,
      versionNumber: v.versionNumber,
      isCurrent: v.isCurrent,
      effectiveFrom: v.effectiveFrom.toISOString().slice(0, 10),
      effectiveTo: v.effectiveTo?.toISOString().slice(0, 10) ?? null,
      summary: v.summary,
      eligibilityNotes: v.eligibilityNotes,
      exclusions: v.exclusions,
      jurisdiction: v.jurisdiction,
      expectedTurnaroundDays: v.expectedTurnaroundDays,
      billingType: v.billingType,
      recurrenceMonths: v.recurrenceMonths,
      requiredInputs: v.requiredInputs as unknown as ServiceVersionSummary['requiredInputs'],
      requiredDocuments: v.requiredDocuments as unknown as ServiceVersionSummary['requiredDocuments'],
      taskTemplate: v.taskTemplate as unknown as ServiceVersionSummary['taskTemplate'],
      deliverables: v.deliverables as unknown as ServiceVersionSummary['deliverables'],
      closureCriteria: v.closureCriteria as unknown as ServiceVersionSummary['closureCriteria'],
      publishedAt: v.publishedAt?.toISOString() ?? null,
      price: v.price
        ? {
            currency: v.price.currency,
            professionalFeeMinor: v.price.professionalFeeMinor,
            governmentFeeMinor: v.price.governmentFeeMinor,
            thirdPartyChargesMinor: v.price.thirdPartyChargesMinor,
            taxRateBps: v.price.taxRateBps,
            taxConfigRef: v.price.taxConfigRef,
            governmentFeeIsEstimate: v.price.governmentFeeIsEstimate,
            notes: v.price.notes,
          }
        : null,
      createdAt: v.createdAt.toISOString(),
    };
  }

  private toService(s: ServiceRow): ServiceSummary {
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      status: s.status,
      shortDescription: s.shortDescription,
      category: s.category,
      owner: s.owner,
      reviewCadenceDays: s.reviewCadenceDays,
      lastVerifiedAt: s.lastVerifiedAt?.toISOString() ?? null,
      currentVersion: s.versions[0] ? this.toVersion(s.versions[0]) : null,
      versionCount: s._count.versions,
      isDemo: s.isDemo,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  async listServices(q: ServiceListQuery) {
    const where: Prisma.ServiceWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.q ? { OR: [{ name: { contains: q.q, mode: 'insensitive' } }, { code: { contains: q.q, mode: 'insensitive' } }] } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ where, include: serviceInclude, orderBy: [{ name: 'asc' }], ...skipTake(q) }),
      this.prisma.service.count({ where }),
    ]);
    return paginated(rows.map((r) => this.toService(r)), total, q);
  }

  async getService(id: string): Promise<ServiceSummary & { versions: ServiceVersionSummary[] }> {
    const s = await this.prisma.service.findUnique({ where: { id }, include: serviceInclude });
    if (!s) throw new NotFoundException('Service not found.');
    const versions = await this.prisma.serviceVersion.findMany({ where: { serviceId: id }, include: versionInclude, orderBy: { versionNumber: 'desc' } });
    return { ...this.toService(s), versions: versions.map((v) => this.toVersion(v)) };
  }

  async createService(actor: Principal, dto: CreateServiceDto, meta: RequestMeta) {
    if (await this.prisma.service.findUnique({ where: { code: dto.code } })) throw new ConflictException('Service code already exists.');
    await this.assertCategory(dto.categoryId);
    const content = dto.initialVersion ?? { effectiveFrom: new Date() };
    const created = await this.prisma.$transaction(async (tx) => {
      const s = await tx.service.create({
        data: {
          code: dto.code, name: dto.name, categoryId: dto.categoryId, shortDescription: dto.shortDescription ?? null,
          ownerUserId: dto.ownerUserId ?? null, reviewCadenceDays: dto.reviewCadenceDays ?? null,
          status: ServiceStatus.DRAFT, createdById: actor.userId, updatedById: actor.userId,
          versions: {
            create: {
              versionNumber: 1, isCurrent: false, createdById: actor.userId,
              ...this.versionData(content),
              ...(dto.price ? { price: { create: dto.price } } : {}),
            },
          },
        },
      });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.service.create', resourceType: 'service', resourceId: s.id, after: { code: s.code, name: s.name, categoryId: s.categoryId } });
      return s;
    });
    return this.getService(created.id);
  }

  async updateService(actor: Principal, id: string, dto: UpdateServiceDto, meta: RequestMeta) {
    const before = await this.prisma.service.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Service not found.');
    if (dto.categoryId) await this.assertCategory(dto.categoryId);
    await this.prisma.$transaction(async (tx) => {
      const s = await tx.service.update({ where: { id }, data: { ...dto, updatedById: actor.userId } });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.service.update', resourceType: 'service', resourceId: id, before: pick(before, Object.keys(dto)), after: pick(s, Object.keys(dto)) });
    });
    return this.getService(id);
  }

  async changeStatus(actor: Principal, id: string, dto: ServiceStatusDto, meta: RequestMeta) {
    const s = await this.prisma.service.findUnique({ where: { id }, include: { versions: { where: { isCurrent: true }, take: 1 } } });
    if (!s) throw new NotFoundException('Service not found.');
    if (!TRANSITIONS[s.status].includes(dto.status)) throw new BadRequestException(`Cannot move a ${s.status} service to ${dto.status}.`);
    if (dto.status === 'ACTIVE' && s.versions.length === 0) throw new BadRequestException('Publish a service version before activating the service.');
    if (dto.status === 'RETIRED' && !dto.reason) throw new BadRequestException('A reason is required to retire a service.');
    await this.prisma.$transaction(async (tx) => {
      await tx.service.update({ where: { id }, data: { status: dto.status, updatedById: actor.userId } });
      await this.audit.record({ tx, actor, meta, action: `catalogue.service.${dto.status.toLowerCase()}`, resourceType: 'service', resourceId: id, before: { status: s.status }, after: { status: dto.status }, metadata: { reason: dto.reason } });
    });
    return this.getService(id);
  }

  async markVerified(actor: Principal, id: string, meta: RequestMeta) {
    const s = await this.prisma.service.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Service not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.service.update({ where: { id }, data: { lastVerifiedAt: new Date(), updatedById: actor.userId } });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.service.verify', resourceType: 'service', resourceId: id, before: { lastVerifiedAt: s.lastVerifiedAt }, after: { lastVerifiedAt: new Date() } });
    });
    return this.getService(id);
  }

  // -------------------------------------------------------------- versions

  private versionData(c: VersionContentDto) {
    return {
      effectiveFrom: c.effectiveFrom,
      summary: c.summary ?? null,
      eligibilityNotes: c.eligibilityNotes ?? null,
      exclusions: c.exclusions ?? null,
      jurisdiction: c.jurisdiction ?? null,
      expectedTurnaroundDays: c.expectedTurnaroundDays ?? null,
      billingType: c.billingType ?? 'ONE_TIME',
      recurrenceMonths: c.recurrenceMonths ?? null,
      requiredInputs: (c.requiredInputs ?? []) as Prisma.InputJsonValue,
      requiredDocuments: (c.requiredDocuments ?? []) as Prisma.InputJsonValue,
      taskTemplate: (c.taskTemplate ?? []) as Prisma.InputJsonValue,
      deliverables: (c.deliverables ?? []) as Prisma.InputJsonValue,
      closureCriteria: (c.closureCriteria ?? []) as Prisma.InputJsonValue,
    };
  }

  /** Creates a new draft version, copying the latest version's content as a starting point. */
  async createVersion(actor: Principal, serviceId: string, meta: RequestMeta) {
    const latest = await this.prisma.serviceVersion.findFirst({ where: { serviceId }, orderBy: { versionNumber: 'desc' }, include: versionInclude });
    if (!latest) throw new NotFoundException('Service not found.');
    if (!latest.publishedAt) throw new BadRequestException(`Version ${latest.versionNumber} is still a draft; edit or publish it first.`);
    const v = await this.prisma.$transaction(async (tx) => {
      const { id: _id, price, versionNumber, isCurrent: _c, publishedAt: _p, createdAt: _ca, createdById: _cb, effectiveTo: _et, ...rest } = latest;
      const created = await tx.serviceVersion.create({
        data: {
          ...rest,
          requiredInputs: rest.requiredInputs as Prisma.InputJsonValue,
          requiredDocuments: rest.requiredDocuments as Prisma.InputJsonValue,
          taskTemplate: rest.taskTemplate as Prisma.InputJsonValue,
          deliverables: rest.deliverables as Prisma.InputJsonValue,
          closureCriteria: rest.closureCriteria as Prisma.InputJsonValue,
          versionNumber: versionNumber + 1,
          isCurrent: false,
          effectiveFrom: new Date(),
          createdById: actor.userId,
          ...(price ? { price: { create: { ...stripPrice(price) } } } : {}),
        },
        include: versionInclude,
      });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.version.create', resourceType: 'service_version', resourceId: created.id, metadata: { serviceId, versionNumber: created.versionNumber, copiedFrom: latest.versionNumber } });
      return created;
    });
    return this.toVersion(v);
  }

  async updateVersion(actor: Principal, serviceId: string, versionId: string, dto: Partial<VersionContentDto>, meta: RequestMeta) {
    const v = await this.getDraftVersion(serviceId, versionId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const data = this.versionData({ ...(v as unknown as VersionContentDto), ...dto, effectiveFrom: dto.effectiveFrom ?? v.effectiveFrom });
      const u = await tx.serviceVersion.update({ where: { id: versionId }, data, include: versionInclude });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.version.update', resourceType: 'service_version', resourceId: versionId, before: pick(v, Object.keys(dto)), after: pick(u, Object.keys(dto)) });
      return u;
    });
    return this.toVersion(updated);
  }

  async setPrice(actor: Principal, serviceId: string, versionId: string, dto: PriceDto, meta: RequestMeta) {
    const v = await this.getDraftVersion(serviceId, versionId);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.servicePrice.upsert({ where: { serviceVersionId: versionId }, create: { serviceVersionId: versionId, ...dto }, update: dto });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.version.price.set', resourceType: 'service_version', resourceId: versionId, before: v.price ? stripPrice(v.price) : null, after: dto });
      return tx.serviceVersion.findUniqueOrThrow({ where: { id: versionId }, include: versionInclude });
    });
    return this.toVersion(updated);
  }

  /** Publishing freezes the version and makes it current. Previous current version is closed, never modified further. */
  async publishVersion(actor: Principal, serviceId: string, versionId: string, meta: RequestMeta) {
    const v = await this.getDraftVersion(serviceId, versionId);
    if (!v.price) throw new BadRequestException('Set a price before publishing this version.');
    const published = await this.prisma.$transaction(async (tx) => {
      const previous = await tx.serviceVersion.findFirst({ where: { serviceId, isCurrent: true } });
      if (previous) {
        const dayBefore = new Date(v.effectiveFrom);
        dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
        await tx.serviceVersion.update({ where: { id: previous.id }, data: { isCurrent: false, effectiveTo: dayBefore < previous.effectiveFrom ? previous.effectiveFrom : dayBefore } });
      }
      const p = await tx.serviceVersion.update({ where: { id: versionId }, data: { isCurrent: true, publishedAt: new Date() }, include: versionInclude });
      await tx.service.update({ where: { id: serviceId }, data: { updatedById: actor.userId } });
      await this.audit.record({ tx, actor, meta, action: 'catalogue.version.publish', resourceType: 'service_version', resourceId: versionId, metadata: { serviceId, versionNumber: p.versionNumber, replaced: previous?.versionNumber ?? null } });
      return p;
    });
    return this.toVersion(published);
  }

  private async getDraftVersion(serviceId: string, versionId: string) {
    const v = await this.prisma.serviceVersion.findFirst({ where: { id: versionId, serviceId }, include: versionInclude });
    if (!v) throw new NotFoundException('Service version not found.');
    if (v.publishedAt) throw new BadRequestException(`Version ${v.versionNumber} is published and immutable; create a new version instead.`);
    return v;
  }
}

function stripPrice(p: Prisma.ServicePriceGetPayload<object>) {
  const { id: _i, serviceVersionId: _s, createdAt: _c, updatedAt: _u, ...rest } = p;
  return rest;
}

function pick(obj: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}
