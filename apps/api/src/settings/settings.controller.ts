import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { organisationSettingsSchema, updateSequenceSchema, type OrganisationSettingsDto, type UpdateSequenceDto } from './settings.schemas.js';
import { SettingsService } from './settings.service.js';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('organisation')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Organisation profile, timezone, currency and notification defaults' })
  organisation() {
    return this.settings.getOrganisation();
  }

  @Put('organisation')
  @RequirePermissions('settings.manage')
  updateOrganisation(@CurrentUser() actor: Principal, @Body({ schema: organisationSettingsSchema }) dto: OrganisationSettingsDto, @ReqMeta() meta: RequestMeta) {
    return this.settings.updateOrganisation(actor, dto, meta);
  }

  @Get('sequences')
  @RequirePermissions('settings.read')
  sequences() {
    return this.settings.listSequences();
  }

  @Patch('sequences/:key')
  @RequirePermissions('settings.manage')
  updateSequence(
    @CurrentUser() actor: Principal,
    @Param('key', { schema: z.string().regex(/^[A-Z_]{2,40}$/) }) key: string,
    @Body({ schema: updateSequenceSchema }) dto: UpdateSequenceDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.settings.updateSequence(actor, key, dto, meta);
  }

  @Get('timezones')
  @RequirePermissions('settings.read')
  timezones() {
    return Intl.supportedValuesOf('timeZone');
  }
}
