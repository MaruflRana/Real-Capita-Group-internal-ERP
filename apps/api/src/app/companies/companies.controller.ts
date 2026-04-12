import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireAdminAccess } from '../auth/decorators/require-admin-access.decorator';
import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { CompaniesService } from './companies.service';
import { CompaniesListQueryDto } from './dto/companies-list-query.dto';
import { CompaniesListResponseDto } from './dto/companies-list-response.dto';
import { CompanyDto } from './dto/company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @RequireAdminAccess()
  @ApiOperation({
    summary: 'List companies visible to the authenticated admin.',
  })
  @ApiOkResponse({
    description: 'Visible companies were returned.',
    type: CompaniesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  listCompanies(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Query() query: CompaniesListQueryDto,
  ) {
    return this.companiesService.listVisibleCompanies(authenticatedUser, query);
  }

  @Get(':companyId')
  @RequireCompanyAdminAccess({
    allowInactiveCompany: true,
  })
  @ApiOperation({
    summary: 'Return company detail for a company where the caller has admin access.',
  })
  @ApiOkResponse({
    description: 'Company detail was returned.',
    type: CompanyDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company was not found.',
    type: ApiErrorResponseDto,
  })
  getCompany(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ) {
    return this.companiesService.getCompanyDetail(companyId, authenticatedUser.id);
  }

  @Post()
  @RequireAdminAccess()
  @ApiOperation({
    summary:
      'Create a company and attach the authenticated admin as a company_admin for the new company.',
  })
  @ApiCreatedResponse({
    description: 'Company was created.',
    type: CompanyDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the admin role baseline is missing.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The company slug is already in use.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  createCompany(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companiesService.createCompany(
      authenticatedUser,
      requestId,
      createCompanyDto,
    );
  }

  @Patch(':companyId')
  @RequireCompanyAdminAccess({
    allowInactiveCompany: true,
  })
  @ApiOperation({
    summary: 'Update company basic metadata.',
  })
  @ApiOkResponse({
    description: 'Company metadata was updated.',
    type: CompanyDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The company slug is already in use.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company was not found.',
    type: ApiErrorResponseDto,
  })
  updateCompany(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(
      companyId,
      authenticatedUser.id,
      requestId,
      updateCompanyDto,
    );
  }

  @Post(':companyId/activate')
  @RequireCompanyAdminAccess({
    allowInactiveCompany: true,
  })
  @ApiOperation({
    summary: 'Activate a company.',
  })
  @ApiOkResponse({
    description: 'Company was activated.',
    type: CompanyDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company was not found.',
    type: ApiErrorResponseDto,
  })
  activateCompany(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.companiesService.setCompanyActiveState(
      companyId,
      authenticatedUser.id,
      requestId,
      true,
    );
  }

  @Post(':companyId/deactivate')
  @RequireCompanyAdminAccess({
    allowInactiveCompany: true,
  })
  @ApiOperation({
    summary: 'Deactivate a company.',
  })
  @ApiOkResponse({
    description: 'Company was deactivated.',
    type: CompanyDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company was not found.',
    type: ApiErrorResponseDto,
  })
  deactivateCompany(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.companiesService.setCompanyActiveState(
      companyId,
      authenticatedUser.id,
      requestId,
      false,
    );
  }
}
