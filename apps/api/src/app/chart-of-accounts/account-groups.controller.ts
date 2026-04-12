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
  AccountGroupDto,
  AccountGroupsListQueryDto,
  AccountGroupsListResponseDto,
  CreateAccountGroupDto,
  UpdateAccountGroupDto,
} from './dto/account-groups.dto';

@ApiTags('account-groups')
@Controller('companies/:companyId/accounting/account-groups')
@RequireCompanyAccountingAccess()
export class AccountGroupsController {
  constructor(
    private readonly chartOfAccountsService: ChartOfAccountsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List account groups for a company.',
  })
  @ApiOkResponse({
    description: 'Account groups were returned.',
    type: AccountGroupsListResponseDto,
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
  listAccountGroups(
    @Param('companyId') companyId: string,
    @Query() query: AccountGroupsListQueryDto,
  ) {
    return this.chartOfAccountsService.listAccountGroups(companyId, query);
  }

  @Get(':accountGroupId')
  @ApiOperation({
    summary: 'Return account group detail.',
  })
  @ApiOkResponse({
    description: 'Account group detail was returned.',
    type: AccountGroupDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or account group was not found.',
    type: ApiErrorResponseDto,
  })
  getAccountGroup(
    @Param('companyId') companyId: string,
    @Param('accountGroupId') accountGroupId: string,
  ) {
    return this.chartOfAccountsService.getAccountGroupDetail(
      companyId,
      accountGroupId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create an account group for a company.',
  })
  @ApiCreatedResponse({
    description: 'Account group was created.',
    type: AccountGroupDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an inactive parent class was selected.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The account group code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createAccountGroup(
    @Param('companyId') companyId: string,
    @Body() createAccountGroupDto: CreateAccountGroupDto,
  ) {
    return this.chartOfAccountsService.createAccountGroup(
      companyId,
      createAccountGroupDto,
    );
  }

  @Patch(':accountGroupId')
  @ApiOperation({
    summary: 'Update an account group.',
  })
  @ApiOkResponse({
    description: 'Account group was updated.',
    type: AccountGroupDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an inactive parent class was selected.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The account group code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, account group, or account class was not found.',
    type: ApiErrorResponseDto,
  })
  updateAccountGroup(
    @Param('companyId') companyId: string,
    @Param('accountGroupId') accountGroupId: string,
    @Body() updateAccountGroupDto: UpdateAccountGroupDto,
  ) {
    return this.chartOfAccountsService.updateAccountGroup(
      companyId,
      accountGroupId,
      updateAccountGroupDto,
    );
  }

  @Post(':accountGroupId/activate')
  @ApiOperation({
    summary: 'Activate an account group.',
  })
  @ApiOkResponse({
    description: 'Account group was activated.',
    type: AccountGroupDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or account group was not found.',
    type: ApiErrorResponseDto,
  })
  activateAccountGroup(
    @Param('companyId') companyId: string,
    @Param('accountGroupId') accountGroupId: string,
  ) {
    return this.chartOfAccountsService.setAccountGroupActiveState(
      companyId,
      accountGroupId,
      true,
    );
  }

  @Post(':accountGroupId/deactivate')
  @ApiOperation({
    summary: 'Deactivate an account group.',
  })
  @ApiOkResponse({
    description: 'Account group was deactivated.',
    type: AccountGroupDto,
  })
  @ApiBadRequestResponse({
    description: 'Active child ledger accounts prevent deactivation.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or account group was not found.',
    type: ApiErrorResponseDto,
  })
  deactivateAccountGroup(
    @Param('companyId') companyId: string,
    @Param('accountGroupId') accountGroupId: string,
  ) {
    return this.chartOfAccountsService.setAccountGroupActiveState(
      companyId,
      accountGroupId,
      false,
    );
  }
}
