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
import { RequireCompanyPayrollAccess } from '../auth/decorators/require-company-payroll-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreatePayrollRunDto,
  PayrollRunDto,
  PayrollRunsListQueryDto,
  PayrollRunsListResponseDto,
  PostPayrollRunDto,
  UpdatePayrollRunDto,
} from './dto/payroll-runs.dto';
import { PayrollRunsService } from './payroll-runs.service';

@ApiTags('payroll-runs')
@Controller('companies/:companyId/payroll-runs')
@RequireCompanyPayrollAccess()
export class PayrollRunsController {
  constructor(private readonly payrollRunsService: PayrollRunsService) {}

  @Get()
  @ApiOperation({
    summary: 'List payroll runs for a company.',
  })
  @ApiOkResponse({
    description: 'Payroll runs were returned.',
    type: PayrollRunsListResponseDto,
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
  listPayrollRuns(
    @Param('companyId') companyId: string,
    @Query() query: PayrollRunsListQueryDto,
  ) {
    return this.payrollRunsService.listPayrollRuns(companyId, query);
  }

  @Get(':payrollRunId')
  @ApiOperation({
    summary: 'Return payroll run detail.',
  })
  @ApiOkResponse({
    description: 'Payroll run detail was returned.',
    type: PayrollRunDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or payroll run was not found.',
    type: ApiErrorResponseDto,
  })
  getPayrollRun(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollRunsService.getPayrollRunDetail(companyId, payrollRunId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a payroll run.',
  })
  @ApiCreatedResponse({
    description: 'Payroll run was created.',
    type: PayrollRunDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or payroll scope is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A payroll run already exists for the selected period and scope.',
    type: ApiErrorResponseDto,
  })
  createPayrollRun(
    @Param('companyId') companyId: string,
    @Body() createPayrollRunDto: CreatePayrollRunDto,
  ) {
    return this.payrollRunsService.createPayrollRun(
      companyId,
      createPayrollRunDto,
    );
  }

  @Patch(':payrollRunId')
  @ApiOperation({
    summary: 'Update a draft payroll run.',
  })
  @ApiOkResponse({
    description: 'Payroll run was updated.',
    type: PayrollRunDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, payroll scope is invalid, or the payroll run is no longer draft.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A payroll run already exists for the selected period and scope.',
    type: ApiErrorResponseDto,
  })
  updatePayrollRun(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @Body() updatePayrollRunDto: UpdatePayrollRunDto,
  ) {
    return this.payrollRunsService.updatePayrollRun(
      companyId,
      payrollRunId,
      updatePayrollRunDto,
    );
  }

  @Post(':payrollRunId/finalize')
  @ApiOperation({
    summary: 'Finalize a draft payroll run for review.',
  })
  @ApiOkResponse({
    description: 'Payroll run was finalized.',
    type: PayrollRunDto,
  })
  @ApiBadRequestResponse({
    description: 'The payroll run cannot be finalized in its current state.',
    type: ApiErrorResponseDto,
  })
  finalizePayrollRun(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollRunsService.finalizePayrollRun(companyId, payrollRunId);
  }

  @Post(':payrollRunId/cancel')
  @ApiOperation({
    summary: 'Cancel a payroll run before posting.',
  })
  @ApiOkResponse({
    description: 'Payroll run was cancelled.',
    type: PayrollRunDto,
  })
  @ApiBadRequestResponse({
    description: 'The payroll run cannot be cancelled in its current state.',
    type: ApiErrorResponseDto,
  })
  cancelPayrollRun(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
  ) {
    return this.payrollRunsService.cancelPayrollRun(companyId, payrollRunId);
  }

  @Post(':payrollRunId/post')
  @ApiOperation({
    summary: 'Post a finalized payroll run into the accounting voucher engine.',
  })
  @ApiOkResponse({
    description: 'Payroll run was posted to accounting.',
    type: PayrollRunDto,
  })
  @ApiBadRequestResponse({
    description:
      'Posting failed because the payroll run is invalid, already posted, unbalanced, or mapped to invalid accounts.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The payroll run is already linked to an accounting voucher.',
    type: ApiErrorResponseDto,
  })
  postPayrollRun(
    @Param('companyId') companyId: string,
    @Param('payrollRunId') payrollRunId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() postPayrollRunDto: PostPayrollRunDto,
  ) {
    return this.payrollRunsService.postPayrollRun(
      companyId,
      payrollRunId,
      authenticatedUser,
      requestId,
      postPayrollRunDto,
    );
  }
}
