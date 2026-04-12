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

import { RequireCompanyPayrollAccess } from '../auth/decorators/require-company-payroll-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateSalaryStructureDto,
  SalaryStructureDto,
  SalaryStructuresListQueryDto,
  SalaryStructuresListResponseDto,
  UpdateSalaryStructureDto,
} from './dto/salary-structures.dto';
import { SalaryStructuresService } from './salary-structures.service';

@ApiTags('salary-structures')
@Controller('companies/:companyId/salary-structures')
@RequireCompanyPayrollAccess()
export class SalaryStructuresController {
  constructor(
    private readonly salaryStructuresService: SalaryStructuresService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List salary structures for a company.',
  })
  @ApiOkResponse({
    description: 'Salary structures were returned.',
    type: SalaryStructuresListResponseDto,
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
  listSalaryStructures(
    @Param('companyId') companyId: string,
    @Query() query: SalaryStructuresListQueryDto,
  ) {
    return this.salaryStructuresService.listSalaryStructures(companyId, query);
  }

  @Get(':salaryStructureId')
  @ApiOperation({
    summary: 'Return salary structure detail.',
  })
  @ApiOkResponse({
    description: 'Salary structure detail was returned.',
    type: SalaryStructureDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or salary structure was not found.',
    type: ApiErrorResponseDto,
  })
  getSalaryStructure(
    @Param('companyId') companyId: string,
    @Param('salaryStructureId') salaryStructureId: string,
  ) {
    return this.salaryStructuresService.getSalaryStructureDetail(
      companyId,
      salaryStructureId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a salary structure.',
  })
  @ApiCreatedResponse({
    description: 'Salary structure was created.',
    type: SalaryStructureDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The salary structure conflicts with an existing company record.',
    type: ApiErrorResponseDto,
  })
  createSalaryStructure(
    @Param('companyId') companyId: string,
    @Body() createSalaryStructureDto: CreateSalaryStructureDto,
  ) {
    return this.salaryStructuresService.createSalaryStructure(
      companyId,
      createSalaryStructureDto,
    );
  }

  @Patch(':salaryStructureId')
  @ApiOperation({
    summary: 'Update a salary structure.',
  })
  @ApiOkResponse({
    description: 'Salary structure was updated.',
    type: SalaryStructureDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The salary structure conflicts with an existing company record.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or salary structure was not found.',
    type: ApiErrorResponseDto,
  })
  updateSalaryStructure(
    @Param('companyId') companyId: string,
    @Param('salaryStructureId') salaryStructureId: string,
    @Body() updateSalaryStructureDto: UpdateSalaryStructureDto,
  ) {
    return this.salaryStructuresService.updateSalaryStructure(
      companyId,
      salaryStructureId,
      updateSalaryStructureDto,
    );
  }

  @Post(':salaryStructureId/activate')
  @ApiOperation({
    summary: 'Activate a salary structure.',
  })
  @ApiOkResponse({
    description: 'Salary structure was activated.',
    type: SalaryStructureDto,
  })
  activateSalaryStructure(
    @Param('companyId') companyId: string,
    @Param('salaryStructureId') salaryStructureId: string,
  ) {
    return this.salaryStructuresService.setSalaryStructureActiveState(
      companyId,
      salaryStructureId,
      true,
    );
  }

  @Post(':salaryStructureId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a salary structure.',
  })
  @ApiOkResponse({
    description: 'Salary structure was deactivated.',
    type: SalaryStructureDto,
  })
  deactivateSalaryStructure(
    @Param('companyId') companyId: string,
    @Param('salaryStructureId') salaryStructureId: string,
  ) {
    return this.salaryStructuresService.setSalaryStructureActiveState(
      companyId,
      salaryStructureId,
      false,
    );
  }
}
