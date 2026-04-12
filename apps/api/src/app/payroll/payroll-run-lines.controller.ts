import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  BulkUpsertPayrollRunLinesDto,
  CreatePayrollRunLineDto,
  PayrollRunLineDto,
  PayrollRunLinesListQueryDto,
  PayrollRunLinesListResponseDto,
  UpdatePayrollRunLineDto,
} from './dto/payroll-run-lines.dto';
import { PayrollRunLinesService } from './payroll-run-lines.service';

@ApiTags('payroll-run-lines')
@Controller('companies/:companyId/payroll-runs/:payrollRunId/lines')
@RequireCompanyPayrollAccess()
export class PayrollRunLinesController {
  constructor(
    private readonly payrollRunLinesService: PayrollRunLinesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List payroll run lines for a payroll run.',
  })
  @ApiOkResponse({
    description: 'Payroll run lines were returned.',
    type: PayrollRunLinesListResponseDto,
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
  listPayrollRunLines(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @Query() query: PayrollRunLinesListQueryDto,
  ) {
    return this.payrollRunLinesService.listPayrollRunLines(
      companyId,
      payrollRunId,
      query,
    );
  }

  @Get(':payrollRunLineId')
  @ApiOperation({
    summary: 'Return payroll run line detail.',
  })
  @ApiOkResponse({
    description: 'Payroll run line detail was returned.',
    type: PayrollRunLineDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, payroll run, or payroll run line was not found.',
    type: ApiErrorResponseDto,
  })
  getPayrollRunLine(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @Param('payrollRunLineId') payrollRunLineId: string,
  ) {
    return this.payrollRunLinesService.getPayrollRunLineDetail(
      companyId,
      payrollRunId,
      payrollRunLineId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a payroll run line on a draft payroll run.',
  })
  @ApiCreatedResponse({
    description: 'Payroll run line was created.',
    type: PayrollRunLineDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, the payroll run is not draft, or employee/amount rules were violated.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A payroll run line already exists for the selected employee.',
    type: ApiErrorResponseDto,
  })
  createPayrollRunLine(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @Body() createPayrollRunLineDto: CreatePayrollRunLineDto,
  ) {
    return this.payrollRunLinesService.createPayrollRunLine(
      companyId,
      payrollRunId,
      createPayrollRunLineDto,
    );
  }

  @Put('bulk')
  @ApiOperation({
    summary: 'Bulk create or update payroll run lines on a draft payroll run.',
  })
  @ApiOkResponse({
    description: 'Payroll run lines were upserted.',
    type: PayrollRunLineDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, the payroll run is not draft, or employee/amount rules were violated.',
    type: ApiErrorResponseDto,
  })
  bulkUpsertPayrollRunLines(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @Body() bulkUpsertPayrollRunLinesDto: BulkUpsertPayrollRunLinesDto,
  ) {
    return this.payrollRunLinesService.bulkUpsertPayrollRunLines(
      companyId,
      payrollRunId,
      bulkUpsertPayrollRunLinesDto,
    );
  }

  @Patch(':payrollRunLineId')
  @ApiOperation({
    summary: 'Update a payroll run line on a draft payroll run.',
  })
  @ApiOkResponse({
    description: 'Payroll run line was updated.',
    type: PayrollRunLineDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, the payroll run is not draft, or amount rules were violated.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, payroll run, or payroll run line was not found.',
    type: ApiErrorResponseDto,
  })
  updatePayrollRunLine(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @Param('payrollRunLineId') payrollRunLineId: string,
    @Body() updatePayrollRunLineDto: UpdatePayrollRunLineDto,
  ) {
    return this.payrollRunLinesService.updatePayrollRunLine(
      companyId,
      payrollRunId,
      payrollRunLineId,
      updatePayrollRunLineDto,
    );
  }

  @Delete(':payrollRunLineId')
  @ApiOperation({
    summary: 'Remove a payroll run line from a draft payroll run.',
  })
  @ApiOkResponse({
    description: 'Payroll run line was removed.',
  })
  @ApiBadRequestResponse({
    description: 'The payroll run is no longer draft.',
    type: ApiErrorResponseDto,
  })
  removePayrollRunLine(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @Param('payrollRunLineId') payrollRunLineId: string,
  ) {
    return this.payrollRunLinesService.removePayrollRunLine(
      companyId,
      payrollRunId,
      payrollRunLineId,
    );
  }
}
