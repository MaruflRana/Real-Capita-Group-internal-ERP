import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyPayrollAccess } from '../auth/decorators/require-company-payroll-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { ParticularAccountsListQueryDto, ParticularAccountsListResponseDto } from '../chart-of-accounts/dto/particular-accounts.dto';
import { EmployeesListQueryDto, EmployeesListResponseDto } from '../hr/dto/employees.dto';
import { CostCentersListQueryDto, CostCentersListResponseDto } from '../project-property/dto/cost-centers.dto';
import { ProjectsListQueryDto, ProjectsListResponseDto } from '../project-property/dto/projects.dto';
import { PayrollReferencesService } from './payroll-references.service';

@ApiTags('payroll-references')
@Controller('companies/:companyId/payroll/references')
@RequireCompanyPayrollAccess()
export class PayrollReferencesController {
  constructor(
    private readonly payrollReferencesService: PayrollReferencesService,
  ) {}

  @Get('projects')
  @ApiOperation({
    summary: 'List project references for payroll selectors.',
  })
  @ApiOkResponse({
    description: 'Project references were returned.',
    type: ProjectsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company payroll, company HR, or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listProjects(
    @Param('companyId') companyId: string,
    @Query() query: ProjectsListQueryDto,
  ) {
    return this.payrollReferencesService.listProjectReferences(companyId, query);
  }

  @Get('cost-centers')
  @ApiOperation({
    summary: 'List cost center references for payroll selectors.',
  })
  @ApiOkResponse({
    description: 'Cost center references were returned.',
    type: CostCentersListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company payroll, company HR, or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listCostCenters(
    @Param('companyId') companyId: string,
    @Query() query: CostCentersListQueryDto,
  ) {
    return this.payrollReferencesService.listCostCenterReferences(
      companyId,
      query,
    );
  }

  @Get('employees')
  @ApiOperation({
    summary: 'List employee references for payroll run line selectors.',
  })
  @ApiOkResponse({
    description: 'Employee references were returned.',
    type: EmployeesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company payroll, company HR, or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listEmployees(
    @Param('companyId') companyId: string,
    @Query() query: EmployeesListQueryDto,
  ) {
    return this.payrollReferencesService.listEmployeeReferences(companyId, query);
  }

  @Get('particular-accounts')
  @ApiOperation({
    summary: 'List posting account references for payroll posting selectors.',
  })
  @ApiOkResponse({
    description: 'Posting account references were returned.',
    type: ParticularAccountsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company payroll, company HR, or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listParticularAccounts(
    @Param('companyId') companyId: string,
    @Query() query: ParticularAccountsListQueryDto,
  ) {
    return this.payrollReferencesService.listParticularAccountReferences(
      companyId,
      query,
    );
  }
}
