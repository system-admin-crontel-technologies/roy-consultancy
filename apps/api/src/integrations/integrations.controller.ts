import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { updateIntegrationSchema, type UpdateIntegrationDto } from './integrations.schemas.js';
import { IntegrationsService } from './integrations.service.js';

const keySchema = z.string().regex(/^[A-Z_]{2,40}$/);

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @RequirePermissions('integrations.read')
  @ApiOperation({ summary: 'Integration registry with health status (secrets never included)' })
  list() {
    return this.integrations.list();
  }

  @Patch(':key')
  @RequirePermissions('integrations.manage')
  update(@CurrentUser() actor: Principal, @Param('key', { schema: keySchema }) key: string, @Body({ schema: updateIntegrationSchema }) dto: UpdateIntegrationDto, @ReqMeta() meta: RequestMeta) {
    return this.integrations.update(actor, key, dto, meta);
  }

  @Post(':key/health-check')
  @HttpCode(200)
  @RequirePermissions('integrations.manage')
  healthCheck(@CurrentUser() actor: Principal, @Param('key', { schema: keySchema }) key: string, @ReqMeta() meta: RequestMeta) {
    return this.integrations.healthCheck(actor, key, meta);
  }
}
