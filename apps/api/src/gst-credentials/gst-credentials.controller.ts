import { Body, Controller, Delete, Get, Header, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import {
  createGstCredentialSchema,
  gstCredentialQuerySchema,
  updateGstCredentialSchema,
  type CreateGstCredentialDto,
  type GstCredentialQuery,
  type UpdateGstCredentialDto,
} from './gst-credentials.schemas.js';
import { GstCredentialsService } from './gst-credentials.service.js';

const idSchema = z.string().uuid();

@ApiTags('gst-credentials')
@Controller('gst-credentials')
export class GstCredentialsController {
  constructor(private readonly creds: GstCredentialsService) {}

  @Get()
  @RequirePermissions('gst_credentials.read')
  @ApiOperation({ summary: 'List GST portal logins (passwords excluded); search by client name' })
  list(@Query({ schema: gstCredentialQuerySchema }) q: GstCredentialQuery) {
    return this.creds.list(q);
  }

  @Post()
  @RequirePermissions('gst_credentials.manage')
  @HttpCode(201)
  create(@CurrentUser() actor: Principal, @Body({ schema: createGstCredentialSchema }) dto: CreateGstCredentialDto, @ReqMeta() meta: RequestMeta) {
    return this.creds.create(actor, dto, meta);
  }

  @Patch(':id')
  @RequirePermissions('gst_credentials.manage')
  update(@CurrentUser() actor: Principal, @Param('id', { schema: idSchema }) id: string, @Body({ schema: updateGstCredentialSchema }) dto: UpdateGstCredentialDto, @ReqMeta() meta: RequestMeta) {
    return this.creds.update(actor, id, dto, meta);
  }

  @Delete(':id')
  @RequirePermissions('gst_credentials.manage')
  @HttpCode(204)
  async remove(@CurrentUser() actor: Principal, @Param('id', { schema: idSchema }) id: string, @ReqMeta() meta: RequestMeta) {
    await this.creds.remove(actor, id, meta);
  }

  @Post(':id/reveal')
  @RequirePermissions('gst_credentials.read')
  @HttpCode(200)
  @Header('cache-control', 'no-store')
  @ApiOperation({ summary: 'Decrypt one password (audited)' })
  reveal(@CurrentUser() actor: Principal, @Param('id', { schema: idSchema }) id: string, @ReqMeta() meta: RequestMeta) {
    return this.creds.reveal(actor, id, meta);
  }
}
