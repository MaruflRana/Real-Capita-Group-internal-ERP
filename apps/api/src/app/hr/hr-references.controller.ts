import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyHrAccess } from '../auth/decorators/require-company-hr-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { DepartmentsListQueryDto } from '../departments/dto/departments-list-query.dto';
import { DepartmentsListResponseDto } from '../departments/dto/departments-list-response.dto';
import { LocationsListQueryDto } from '../locations/dto/locations-list-query.dto';
import { LocationsListResponseDto } from '../locations/dto/locations-list-response.dto';
import { CompanyUsersListQueryDto } from '../users/dto/company-users-list-query.dto';
import { CompanyUsersListResponseDto } from '../users/dto/company-users-list-response.dto';
import { HrReferencesService } from './hr-references.service';

@ApiTags('hr-references')
@Controller('companies/:companyId/hr/references')
@RequireCompanyHrAccess()
export class HrReferencesController {
  constructor(private readonly referencesService: HrReferencesService) {}

  @Get('departments')
  @ApiOperation({
    summary: 'List company department references for HR selectors.',
  })
  @ApiOkResponse({
    description: 'Department references were returned.',
    type: DepartmentsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company HR or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listDepartments(
    @Param('companyId') companyId: string,
    @Query() query: DepartmentsListQueryDto,
  ) {
    return this.referencesService.listDepartmentReferences(companyId, query);
  }

  @Get('locations')
  @ApiOperation({
    summary: 'List company location references for HR selectors.',
  })
  @ApiOkResponse({
    description: 'Location references were returned.',
    type: LocationsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company HR or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listLocations(
    @Param('companyId') companyId: string,
    @Query() query: LocationsListQueryDto,
  ) {
    return this.referencesService.listLocationReferences(companyId, query);
  }

  @Get('users')
  @ApiOperation({
    summary: 'List company user references for HR employee linkage selectors.',
  })
  @ApiOkResponse({
    description: 'Company user references were returned.',
    type: CompanyUsersListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company HR or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listUsers(
    @Param('companyId') companyId: string,
    @Query() query: CompanyUsersListQueryDto,
  ) {
    return this.referencesService.listUserReferences(companyId, query);
  }
}
