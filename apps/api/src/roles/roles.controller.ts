import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { createRoleSchema, setPermissionsSchema, updateRoleSchema, type CreateRoleDto, type SetPermissionsDto, type UpdateRoleDto } from './roles.schemas.js';
import { RolesService } from './roles.service.js';

const uuid = z.string().uuid();

@ApiTags('roles')
@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('permissions')
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Permission catalogue' })
  permissions() {
    return this.roles.listPermissions();
  }

  @Get('roles')
  @RequirePermissions('roles.read')
  list() {
    return this.roles.list();
  }

  @Get('roles/:id')
  @RequirePermissions('roles.read')
  get(@Param('id', { schema: uuid }) id: string) {
    return this.roles.get(id);
  }

  @Post('roles')
  @RequirePermissions('roles.manage')
  create(@CurrentUser() actor: Principal, @Body({ schema: createRoleSchema }) dto: CreateRoleDto, @ReqMeta() meta: RequestMeta) {
    return this.roles.create(actor, dto, meta);
  }

  @Patch('roles/:id')
  @RequirePermissions('roles.manage')
  update(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: updateRoleSchema }) dto: UpdateRoleDto, @ReqMeta() meta: RequestMeta) {
    return this.roles.update(actor, id, dto, meta);
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Replace the permission grants of a role' })
  setPermissions(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: setPermissionsSchema }) dto: SetPermissionsDto, @ReqMeta() meta: RequestMeta) {
    return this.roles.setPermissions(actor, id, dto, meta);
  }
}
