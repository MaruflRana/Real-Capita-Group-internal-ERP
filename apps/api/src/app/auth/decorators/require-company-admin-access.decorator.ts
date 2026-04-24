import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { getPhase1ModuleAllowedRoles } from '@real-capita/config';

import { CompanyScope, type CompanyScopeOptions } from './company-scope.decorator';
import { RequireRoles } from './roles.decorator';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { CompanyAssignmentGuard } from '../guards/company-assignment.guard';

export const RequireCompanyAdminAccess = (
  options: CompanyScopeOptions = {},
) =>
  applyDecorators(
    ApiBearerAuth(),
    CompanyScope(options),
    RequireRoles(...getPhase1ModuleAllowedRoles('orgSecurity')),
    UseGuards(AccessTokenGuard, CompanyAssignmentGuard),
  );
