import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DepartmentsService } from './departments.service.js';
import { DepartmentsController, UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, DepartmentsController],
  providers: [UsersService, DepartmentsService],
})
export class UsersModule {}
