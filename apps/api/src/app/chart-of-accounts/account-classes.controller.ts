import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyAccountingAccess } from '../auth/decorators/require-company-accounting-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import {
  AccountClassesListQueryDto,
  AccountClassesListResponseDto,
} from './dto/account-classes.dto';

@ApiTags('account-classes')
@Controller('companies/:companyId/accounting/account-classes')
@RequireCompanyAccountingAccess()
export class AccountClassesController {
  constructor(
    private readonly chartOfAccountsService: ChartOfAccountsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List canonical account classes available for the selected company.',
  })
  @ApiOkResponse({
    description: 'Account classes were returned.',
    type: AccountClassesListResponseDto,
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
  listAccountClasses(
    @Param('companyId') companyId: string,
    @Query() query: AccountClassesListQueryDto,
  ) {
    return this.chartOfAccountsService.listAccountClasses(companyId, query);
  }
}
