import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ROLE_COMPANY_ADMIN } from '../constants/auth.constants';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RequireRoles } from './roles.decorator';

export const RequireAdminAccess = () =>
  applyDecorators(
    ApiBearerAuth(),
    RequireRoles(ROLE_COMPANY_ADMIN),
    UseGuards(AccessTokenGuard, RolesGuard),
  );
