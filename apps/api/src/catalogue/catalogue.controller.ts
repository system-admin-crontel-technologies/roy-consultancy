import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import {
  categorySchema, createServiceSchema, priceSchema, serviceListQuerySchema, serviceStatusSchema, updateCategorySchema, updateServiceSchema, versionContentSchema,
  type CategoryDto, type CreateServiceDto, type PriceDto, type ServiceListQuery, type ServiceStatusDto, type UpdateCategoryDto, type UpdateServiceDto, type VersionContentDto,
} from './catalogue.schemas.js';
import { CatalogueService } from './catalogue.service.js';

const uuid = z.string().uuid();
const updateVersionSchema = versionContentSchema.partial().strict();

@ApiTags('catalogue')
@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('categories')
  @RequirePermissions('catalogue.read')
  categories() {
    return this.catalogue.listCategories();
  }

  @Post('categories')
  @RequirePermissions('catalogue.manage')
  createCategory(@CurrentUser() actor: Principal, @Body({ schema: categorySchema }) dto: CategoryDto, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.createCategory(actor, dto, meta);
  }

  @Patch('categories/:id')
  @RequirePermissions('catalogue.manage')
  updateCategory(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: updateCategorySchema }) dto: UpdateCategoryDto, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.updateCategory(actor, id, dto, meta);
  }

  @Get('services')
  @RequirePermissions('catalogue.read')
  services(@Query({ schema: serviceListQuerySchema }) q: ServiceListQuery) {
    return this.catalogue.listServices(q);
  }

  @Post('services')
  @RequirePermissions('catalogue.manage')
  @ApiOperation({ summary: 'Create a draft service with its first draft version' })
  createService(@CurrentUser() actor: Principal, @Body({ schema: createServiceSchema }) dto: CreateServiceDto, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.createService(actor, dto, meta);
  }

  @Get('services/:id')
  @RequirePermissions('catalogue.read')
  service(@Param('id', { schema: uuid }) id: string) {
    return this.catalogue.getService(id);
  }

  @Patch('services/:id')
  @RequirePermissions('catalogue.manage')
  updateService(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: updateServiceSchema }) dto: UpdateServiceDto, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.updateService(actor, id, dto, meta);
  }

  @Post('services/:id/status')
  @HttpCode(200)
  @RequirePermissions('catalogue.manage')
  @ApiOperation({ summary: 'Activate, pause or retire a service' })
  status(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: serviceStatusSchema }) dto: ServiceStatusDto, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.changeStatus(actor, id, dto, meta);
  }

  @Post('services/:id/verify')
  @HttpCode(200)
  @RequirePermissions('catalogue.manage')
  @ApiOperation({ summary: 'Record that the service guidance was reviewed today' })
  verify(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.markVerified(actor, id, meta);
  }

  @Post('services/:id/versions')
  @RequirePermissions('catalogue.manage')
  @ApiOperation({ summary: 'Create a new draft version copied from the latest version' })
  createVersion(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.createVersion(actor, id, meta);
  }

  @Patch('services/:id/versions/:versionId')
  @RequirePermissions('catalogue.manage')
  updateVersion(
    @CurrentUser() actor: Principal,
    @Param('id', { schema: uuid }) id: string,
    @Param('versionId', { schema: uuid }) versionId: string,
    @Body({ schema: updateVersionSchema }) dto: Partial<VersionContentDto>,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.catalogue.updateVersion(actor, id, versionId, dto, meta);
  }

  @Put('services/:id/versions/:versionId/price')
  @RequirePermissions('catalogue.manage')
  setPrice(
    @CurrentUser() actor: Principal,
    @Param('id', { schema: uuid }) id: string,
    @Param('versionId', { schema: uuid }) versionId: string,
    @Body({ schema: priceSchema }) dto: PriceDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.catalogue.setPrice(actor, id, versionId, dto, meta);
  }

  @Post('services/:id/versions/:versionId/publish')
  @HttpCode(200)
  @RequirePermissions('catalogue.manage')
  @ApiOperation({ summary: 'Publish a draft version; it becomes current and immutable' })
  publish(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Param('versionId', { schema: uuid }) versionId: string, @ReqMeta() meta: RequestMeta) {
    return this.catalogue.publishVersion(actor, id, versionId, meta);
  }
}
