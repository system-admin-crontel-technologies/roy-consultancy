import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { createEnquirySchema, enquiryQuerySchema, updateEnquirySchema, type CreateEnquiryDto, type EnquiryQuery, type UpdateEnquiryDto } from './enquiries.schemas.js';
import { EnquiriesService } from './enquiries.service.js';

const idSchema = z.string().uuid();

/** Unauthenticated endpoint used by the marketing website's contact form. */
@ApiTags('public')
@Controller('public/enquiries')
export class PublicEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  @Public()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Submit a website enquiry (rate limited, honeypot protected)' })
  submit(@Body({ schema: createEnquirySchema }) dto: CreateEnquiryDto, @ReqMeta() meta: RequestMeta) {
    return this.enquiries.submit(dto, meta);
  }
}

@ApiTags('enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  @RequirePermissions('leads.read')
  @ApiOperation({ summary: 'List website enquiries' })
  list(@Query({ schema: enquiryQuerySchema }) q: EnquiryQuery) {
    return this.enquiries.list(q);
  }

  @Get(':id')
  @RequirePermissions('leads.read')
  get(@Param('id', { schema: idSchema }) id: string) {
    return this.enquiries.get(id);
  }

  @Patch(':id')
  @RequirePermissions('leads.manage')
  update(@CurrentUser() actor: Principal, @Param('id', { schema: idSchema }) id: string, @Body({ schema: updateEnquirySchema }) dto: UpdateEnquiryDto, @ReqMeta() meta: RequestMeta) {
    return this.enquiries.update(actor, id, dto, meta);
  }
}
