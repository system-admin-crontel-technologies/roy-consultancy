import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { ReqMeta, type RequestMeta } from '../common/decorators/request-meta.decorator.js';
import { DepartmentsService } from './departments.service.js';
import {
  departmentSchema, inviteUserSchema, setUserRolesSchema, statusReasonSchema, updateDepartmentSchema, updateUserSchema, userListQuerySchema,
  type DepartmentDto, type InviteUserDto, type SetUserRolesDto, type StatusReasonDto, type UpdateDepartmentDto, type UpdateUserDto, type UserListQuery,
} from './users.schemas.js';
import { UsersService } from './users.service.js';

const uuid = z.string().uuid();

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List users' })
  list(@Query({ schema: userListQuerySchema }) q: UserListQuery) {
    return this.users.list(q);
  }

  @Post()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Invite a new user' })
  invite(@CurrentUser() actor: Principal, @Body({ schema: inviteUserSchema }) dto: InviteUserDto, @ReqMeta() meta: RequestMeta) {
    return this.users.invite(actor, dto, meta);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  get(@Param('id', { schema: uuid }) id: string) {
    return this.users.get(id);
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  update(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: updateUserSchema }) dto: UpdateUserDto, @ReqMeta() meta: RequestMeta) {
    return this.users.update(actor, id, dto, meta);
  }

  @Post(':id/roles')
  @HttpCode(200)
  @RequirePermissions('users.manage', 'roles.read')
  @ApiOperation({ summary: 'Replace the roles assigned to a user' })
  setRoles(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: setUserRolesSchema }) dto: SetUserRolesDto, @ReqMeta() meta: RequestMeta) {
    return this.users.setRoles(actor, id, dto, meta);
  }

  @Post(':id/resend-invite')
  @HttpCode(202)
  @RequirePermissions('users.manage')
  async resendInvite(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @ReqMeta() meta: RequestMeta) {
    await this.users.resendInvite(actor, id, meta);
    return { accepted: true };
  }

  @Post(':id/suspend')
  @HttpCode(200)
  @RequirePermissions('users.manage')
  suspend(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: statusReasonSchema }) dto: StatusReasonDto, @ReqMeta() meta: RequestMeta) {
    return this.users.changeStatus(actor, id, 'SUSPENDED', dto.reason, meta);
  }

  @Post(':id/activate')
  @HttpCode(200)
  @RequirePermissions('users.manage')
  activate(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: statusReasonSchema }) dto: StatusReasonDto, @ReqMeta() meta: RequestMeta) {
    return this.users.changeStatus(actor, id, 'ACTIVE', dto.reason, meta);
  }

  @Post(':id/disable')
  @HttpCode(200)
  @RequirePermissions('users.manage')
  disable(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: statusReasonSchema }) dto: StatusReasonDto, @ReqMeta() meta: RequestMeta) {
    return this.users.changeStatus(actor, id, 'DISABLED', dto.reason, meta);
  }

  @Get(':id/sessions')
  @RequirePermissions('users.manage')
  sessions(@Param('id', { schema: uuid }) id: string) {
    return this.users.listSessions(id);
  }

  @Post(':id/sessions/revoke-all')
  @HttpCode(200)
  @RequirePermissions('sessions.revoke_any')
  async revokeAll(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @ReqMeta() meta: RequestMeta) {
    return { revoked: await this.users.revokeAllSessions(actor, id, meta) };
  }
}

@ApiTags('users')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @RequirePermissions('users.read')
  list() {
    return this.departments.list();
  }

  @Post()
  @RequirePermissions('users.manage')
  create(@CurrentUser() actor: Principal, @Body({ schema: departmentSchema }) dto: DepartmentDto, @ReqMeta() meta: RequestMeta) {
    return this.departments.create(actor, dto, meta);
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  update(@CurrentUser() actor: Principal, @Param('id', { schema: uuid }) id: string, @Body({ schema: updateDepartmentSchema }) dto: UpdateDepartmentDto, @ReqMeta() meta: RequestMeta) {
    return this.departments.update(actor, id, dto, meta);
  }
}
