import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { getPhase1ModuleAllowedRoles } from '@real-capita/config';

import { AccessTokenGuard } from '../guards/access-token.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RequireRoles } from './roles.decorator';

export const RequireAdminAccess = () =>
  applyDecorators(
    ApiBearerAuth(),
    RequireRoles(...getPhase1ModuleAllowedRoles('orgSecurity')),
    UseGuards(AccessTokenGuard, RolesGuard),
  );
