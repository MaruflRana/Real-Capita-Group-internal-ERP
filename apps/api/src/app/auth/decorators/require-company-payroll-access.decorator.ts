import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import {
  ROLE_COMPANY_ADMIN,
  ROLE_COMPANY_HR,
  ROLE_COMPANY_PAYROLL,
} from '../constants/auth.constants';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { CompanyAssignmentGuard } from '../guards/company-assignment.guard';
import { CompanyScope, type CompanyScopeOptions } from './company-scope.decorator';
import { RequireRoles } from './roles.decorator';

export const RequireCompanyPayrollAccess = (
  options: CompanyScopeOptions = {},
) =>
  applyDecorators(
    ApiBearerAuth(),
    CompanyScope(options),
    RequireRoles(ROLE_COMPANY_ADMIN, ROLE_COMPANY_HR, ROLE_COMPANY_PAYROLL),
    UseGuards(AccessTokenGuard, CompanyAssignmentGuard),
  );
