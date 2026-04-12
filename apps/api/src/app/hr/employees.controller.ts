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

import { RequireCompanyHrAccess } from '../auth/decorators/require-company-hr-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateEmployeeDto,
  EmployeeDto,
  EmployeesListQueryDto,
  EmployeesListResponseDto,
  UpdateEmployeeDto,
} from './dto/employees.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@Controller('companies/:companyId/employees')
@RequireCompanyHrAccess()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({
    summary: 'List employees for a company.',
  })
  @ApiOkResponse({
    description: 'Employees were returned.',
    type: EmployeesListResponseDto,
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
  listEmployees(
    @Param('companyId') companyId: string,
    @Query() query: EmployeesListQueryDto,
  ) {
    return this.employeesService.listEmployees(companyId, query);
  }

  @Get(':employeeId')
  @ApiOperation({
    summary: 'Return employee detail.',
  })
  @ApiOkResponse({
    description: 'Employee detail was returned.',
    type: EmployeeDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or employee was not found.',
    type: ApiErrorResponseDto,
  })
  getEmployee(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.employeesService.getEmployeeDetail(companyId, employeeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an employee.',
  })
  @ApiCreatedResponse({
    description: 'Employee was created.',
    type: EmployeeDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or linked company hierarchy is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The employee conflicts with an existing company employee.',
    type: ApiErrorResponseDto,
  })
  createEmployee(
    @Param('companyId') companyId: string,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.createEmployee(companyId, createEmployeeDto);
  }

  @Patch(':employeeId')
  @ApiOperation({
    summary: 'Update an employee.',
  })
  @ApiOkResponse({
    description: 'Employee was updated.',
    type: EmployeeDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or linked company hierarchy is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The employee conflicts with an existing company employee.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or employee was not found.',
    type: ApiErrorResponseDto,
  })
  updateEmployee(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(
      companyId,
      employeeId,
      updateEmployeeDto,
    );
  }

  @Post(':employeeId/activate')
  @ApiOperation({
    summary: 'Activate an employee.',
  })
  @ApiOkResponse({
    description: 'Employee was activated.',
    type: EmployeeDto,
  })
  activateEmployee(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.employeesService.setEmployeeActiveState(
      companyId,
      employeeId,
      true,
    );
  }

  @Post(':employeeId/deactivate')
  @ApiOperation({
    summary: 'Deactivate an employee.',
  })
  @ApiOkResponse({
    description: 'Employee was deactivated.',
    type: EmployeeDto,
  })
  deactivateEmployee(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.employeesService.setEmployeeActiveState(
      companyId,
      employeeId,
      false,
    );
  }
}
