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
import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentDto } from './dto/department.dto';
import { DepartmentsListQueryDto } from './dto/departments-list-query.dto';
import { DepartmentsListResponseDto } from './dto/departments-list-response.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@ApiTags('departments')
@Controller('companies/:companyId/departments')
@RequireCompanyAdminAccess()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List departments for a company.',
  })
  @ApiOkResponse({
    description: 'Departments were returned.',
    type: DepartmentsListResponseDto,
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
  listDepartments(
    @Param('companyId') companyId: string,
    @Query() query: DepartmentsListQueryDto,
  ) {
    return this.departmentsService.listDepartments(companyId, query);
  }

  @Get(':departmentId')
  @ApiOperation({
    summary: 'Return department detail.',
  })
  @ApiOkResponse({
    description: 'Department detail was returned.',
    type: DepartmentDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or department was not found.',
    type: ApiErrorResponseDto,
  })
  getDepartment(
    @Param('companyId') companyId: string,
    @Param('departmentId') departmentId: string,
  ) {
    return this.departmentsService.getDepartmentDetail(companyId, departmentId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a department for a company.',
  })
  @ApiCreatedResponse({
    description: 'Department was created.',
    type: DepartmentDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The department code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createDepartment(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createDepartmentDto: CreateDepartmentDto,
  ) {
    return this.departmentsService.createDepartment(
      companyId,
      authenticatedUser.id,
      requestId,
      createDepartmentDto,
    );
  }

  @Patch(':departmentId')
  @ApiOperation({
    summary: 'Update a department.',
  })
  @ApiOkResponse({
    description: 'Department was updated.',
    type: DepartmentDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The department code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or department was not found.',
    type: ApiErrorResponseDto,
  })
  updateDepartment(
    @Param('companyId') companyId: string,
    @Param('departmentId') departmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(
      companyId,
      departmentId,
      authenticatedUser.id,
      requestId,
      updateDepartmentDto,
    );
  }

  @Post(':departmentId/activate')
  @ApiOperation({
    summary: 'Activate a department.',
  })
  @ApiOkResponse({
    description: 'Department was activated.',
    type: DepartmentDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or department was not found.',
    type: ApiErrorResponseDto,
  })
  activateDepartment(
    @Param('companyId') companyId: string,
    @Param('departmentId') departmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.departmentsService.setDepartmentActiveState(
      companyId,
      departmentId,
      authenticatedUser.id,
      requestId,
      true,
    );
  }

  @Post(':departmentId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a department.',
  })
  @ApiOkResponse({
    description: 'Department was deactivated.',
    type: DepartmentDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or department was not found.',
    type: ApiErrorResponseDto,
  })
  deactivateDepartment(
    @Param('companyId') companyId: string,
    @Param('departmentId') departmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.departmentsService.setDepartmentActiveState(
      companyId,
      departmentId,
      authenticatedUser.id,
      requestId,
      false,
    );
  }
}
