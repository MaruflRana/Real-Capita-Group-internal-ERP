import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { RoleAssignmentsController } from './role-assignments.controller';
import { RoleAssignmentsService } from './role-assignments.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [RoleAssignmentsController],
  providers: [RoleAssignmentsService],
  exports: [RoleAssignmentsService],
})
export class RoleAssignmentsModule {}
