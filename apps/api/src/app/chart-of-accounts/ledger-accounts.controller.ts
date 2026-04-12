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

import { RequireCompanyAccountingAccess } from '../auth/decorators/require-company-accounting-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import {
  CreateLedgerAccountDto,
  LedgerAccountDto,
  LedgerAccountsListQueryDto,
  LedgerAccountsListResponseDto,
  UpdateLedgerAccountDto,
} from './dto/ledger-accounts.dto';

@ApiTags('ledger-accounts')
@Controller('companies/:companyId/accounting/ledger-accounts')
@RequireCompanyAccountingAccess()
export class LedgerAccountsController {
  constructor(
    private readonly chartOfAccountsService: ChartOfAccountsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List ledger accounts for a company.',
  })
  @ApiOkResponse({
    description: 'Ledger accounts were returned.',
    type: LedgerAccountsListResponseDto,
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
  listLedgerAccounts(
    @Param('companyId') companyId: string,
    @Query() query: LedgerAccountsListQueryDto,
  ) {
    return this.chartOfAccountsService.listLedgerAccounts(companyId, query);
  }

  @Get(':ledgerAccountId')
  @ApiOperation({
    summary: 'Return ledger account detail.',
  })
  @ApiOkResponse({
    description: 'Ledger account detail was returned.',
    type: LedgerAccountDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or ledger account was not found.',
    type: ApiErrorResponseDto,
  })
  getLedgerAccount(
    @Param('companyId') companyId: string,
    @Param('ledgerAccountId') ledgerAccountId: string,
  ) {
    return this.chartOfAccountsService.getLedgerAccountDetail(
      companyId,
      ledgerAccountId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a ledger account for a company.',
  })
  @ApiCreatedResponse({
    description: 'Ledger account was created.',
    type: LedgerAccountDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an inactive parent group was selected.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The ledger account code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createLedgerAccount(
    @Param('companyId') companyId: string,
    @Body() createLedgerAccountDto: CreateLedgerAccountDto,
  ) {
    return this.chartOfAccountsService.createLedgerAccount(
      companyId,
      createLedgerAccountDto,
    );
  }

  @Patch(':ledgerAccountId')
  @ApiOperation({
    summary: 'Update a ledger account.',
  })
  @ApiOkResponse({
    description: 'Ledger account was updated.',
    type: LedgerAccountDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an inactive parent group was selected.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The ledger account code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, ledger account, or account group was not found.',
    type: ApiErrorResponseDto,
  })
  updateLedgerAccount(
    @Param('companyId') companyId: string,
    @Param('ledgerAccountId') ledgerAccountId: string,
    @Body() updateLedgerAccountDto: UpdateLedgerAccountDto,
  ) {
    return this.chartOfAccountsService.updateLedgerAccount(
      companyId,
      ledgerAccountId,
      updateLedgerAccountDto,
    );
  }

  @Post(':ledgerAccountId/activate')
  @ApiOperation({
    summary: 'Activate a ledger account.',
  })
  @ApiOkResponse({
    description: 'Ledger account was activated.',
    type: LedgerAccountDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or ledger account was not found.',
    type: ApiErrorResponseDto,
  })
  activateLedgerAccount(
    @Param('companyId') companyId: string,
    @Param('ledgerAccountId') ledgerAccountId: string,
  ) {
    return this.chartOfAccountsService.setLedgerAccountActiveState(
      companyId,
      ledgerAccountId,
      true,
    );
  }

  @Post(':ledgerAccountId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a ledger account.',
  })
  @ApiOkResponse({
    description: 'Ledger account was deactivated.',
    type: LedgerAccountDto,
  })
  @ApiBadRequestResponse({
    description: 'Active child particular accounts prevent deactivation.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or ledger account was not found.',
    type: ApiErrorResponseDto,
  })
  deactivateLedgerAccount(
    @Param('companyId') companyId: string,
    @Param('ledgerAccountId') ledgerAccountId: string,
  ) {
    return this.chartOfAccountsService.setLedgerAccountActiveState(
      companyId,
      ledgerAccountId,
      false,
    );
  }
}
