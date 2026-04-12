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
  CreateParticularAccountDto,
  ParticularAccountDto,
  ParticularAccountsListQueryDto,
  ParticularAccountsListResponseDto,
  UpdateParticularAccountDto,
} from './dto/particular-accounts.dto';

@ApiTags('particular-accounts')
@Controller('companies/:companyId/accounting/particular-accounts')
@RequireCompanyAccountingAccess()
export class ParticularAccountsController {
  constructor(
    private readonly chartOfAccountsService: ChartOfAccountsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List posting-level particular accounts for a company.',
  })
  @ApiOkResponse({
    description: 'Particular accounts were returned.',
    type: ParticularAccountsListResponseDto,
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
  listParticularAccounts(
    @Param('companyId') companyId: string,
    @Query() query: ParticularAccountsListQueryDto,
  ) {
    return this.chartOfAccountsService.listParticularAccounts(companyId, query);
  }

  @Get(':particularAccountId')
  @ApiOperation({
    summary: 'Return particular account detail.',
  })
  @ApiOkResponse({
    description: 'Particular account detail was returned.',
    type: ParticularAccountDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or particular account was not found.',
    type: ApiErrorResponseDto,
  })
  getParticularAccount(
    @Param('companyId') companyId: string,
    @Param('particularAccountId') particularAccountId: string,
  ) {
    return this.chartOfAccountsService.getParticularAccountDetail(
      companyId,
      particularAccountId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a posting-level particular account for a company.',
  })
  @ApiCreatedResponse({
    description: 'Particular account was created.',
    type: ParticularAccountDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an inactive parent ledger was selected.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'The particular account code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createParticularAccount(
    @Param('companyId') companyId: string,
    @Body() createParticularAccountDto: CreateParticularAccountDto,
  ) {
    return this.chartOfAccountsService.createParticularAccount(
      companyId,
      createParticularAccountDto,
    );
  }

  @Patch(':particularAccountId')
  @ApiOperation({
    summary: 'Update a particular account.',
  })
  @ApiOkResponse({
    description: 'Particular account was updated.',
    type: ParticularAccountDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or an inactive parent ledger was selected.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'The particular account code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, particular account, or ledger account was not found.',
    type: ApiErrorResponseDto,
  })
  updateParticularAccount(
    @Param('companyId') companyId: string,
    @Param('particularAccountId') particularAccountId: string,
    @Body() updateParticularAccountDto: UpdateParticularAccountDto,
  ) {
    return this.chartOfAccountsService.updateParticularAccount(
      companyId,
      particularAccountId,
      updateParticularAccountDto,
    );
  }

  @Post(':particularAccountId/activate')
  @ApiOperation({
    summary: 'Activate a particular account.',
  })
  @ApiOkResponse({
    description: 'Particular account was activated.',
    type: ParticularAccountDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or particular account was not found.',
    type: ApiErrorResponseDto,
  })
  activateParticularAccount(
    @Param('companyId') companyId: string,
    @Param('particularAccountId') particularAccountId: string,
  ) {
    return this.chartOfAccountsService.setParticularAccountActiveState(
      companyId,
      particularAccountId,
      true,
    );
  }

  @Post(':particularAccountId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a particular account.',
  })
  @ApiOkResponse({
    description: 'Particular account was deactivated.',
    type: ParticularAccountDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or particular account was not found.',
    type: ApiErrorResponseDto,
  })
  deactivateParticularAccount(
    @Param('companyId') companyId: string,
    @Param('particularAccountId') particularAccountId: string,
  ) {
    return this.chartOfAccountsService.setParticularAccountActiveState(
      companyId,
      particularAccountId,
      false,
    );
  }
}
