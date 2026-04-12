import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyAccountingAccess } from '../auth/decorators/require-company-accounting-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  BalanceSheetQueryDto,
  BalanceSheetResponseDto,
  GeneralLedgerQueryDto,
  GeneralLedgerResponseDto,
  ProfitAndLossQueryDto,
  ProfitAndLossResponseDto,
  TrialBalanceQueryDto,
  TrialBalanceResponseDto,
} from './dto/financial-reporting.dto';
import { FinancialReportingService } from './financial-reporting.service';

@ApiTags('financial-reporting')
@Controller('companies/:companyId/accounting/reports')
@RequireCompanyAccountingAccess()
export class FinancialReportingController {
  constructor(
    private readonly financialReportingService: FinancialReportingService,
  ) {}

  @Get('trial-balance')
  @ApiOperation({
    summary:
      'Return a company-scoped trial balance built from posted vouchers for the requested period.',
  })
  @ApiOkResponse({
    description: 'Trial balance was returned.',
    type: TrialBalanceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for the requested reporting period or filters.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company accounting or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, ledger account, or particular account was not found.',
    type: ApiErrorResponseDto,
  })
  getTrialBalance(
    @Param('companyId') companyId: string,
    @Query() query: TrialBalanceQueryDto,
  ) {
    return this.financialReportingService.getTrialBalance(companyId, query);
  }

  @Get('general-ledger')
  @ApiOperation({
    summary:
      'Return a posting-account general ledger view with opening balance, period lines, and running balance.',
  })
  @ApiOkResponse({
    description: 'General ledger was returned.',
    type: GeneralLedgerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for the requested reporting period or filters.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company accounting or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or posting account was not found.',
    type: ApiErrorResponseDto,
  })
  getGeneralLedger(
    @Param('companyId') companyId: string,
    @Query() query: GeneralLedgerQueryDto,
  ) {
    return this.financialReportingService.getGeneralLedger(companyId, query);
  }

  @Get('profit-loss')
  @ApiOperation({
    summary:
      'Return a company-scoped profit and loss statement derived from posted revenue and expense activity.',
  })
  @ApiOkResponse({
    description: 'Profit and loss statement was returned.',
    type: ProfitAndLossResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for the requested reporting period.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company accounting or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company was not found.',
    type: ApiErrorResponseDto,
  })
  getProfitAndLoss(
    @Param('companyId') companyId: string,
    @Query() query: ProfitAndLossQueryDto,
  ) {
    return this.financialReportingService.getProfitAndLoss(companyId, query);
  }

  @Get('balance-sheet')
  @ApiOperation({
    summary:
      'Return a company-scoped balance sheet as of the requested date using posted accounting balances.',
  })
  @ApiOkResponse({
    description: 'Balance sheet was returned.',
    type: BalanceSheetResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for the requested as-of date.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company accounting or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company was not found.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description:
      'Statement generation detected an imbalance or other internal report-calculation failure.',
    type: ApiErrorResponseDto,
  })
  getBalanceSheet(
    @Param('companyId') companyId: string,
    @Query() query: BalanceSheetQueryDto,
  ) {
    return this.financialReportingService.getBalanceSheet(
      companyId,
      query.asOfDate,
    );
  }
}
