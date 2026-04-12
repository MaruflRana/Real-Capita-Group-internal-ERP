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
import { RequireCompanySalesAccess } from '../auth/decorators/require-company-sales-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateSaleContractDto,
  SaleContractDto,
  SaleContractsListQueryDto,
  SaleContractsListResponseDto,
  UpdateSaleContractDto,
} from './dto/sale-contracts.dto';
import { SaleContractsService } from './sale-contracts.service';

@ApiTags('sale-contracts')
@Controller('companies/:companyId/sale-contracts')
@RequireCompanySalesAccess()
export class SaleContractsController {
  constructor(private readonly saleContractsService: SaleContractsService) {}

  @Get()
  @ApiOperation({
    summary: 'List sale contracts for a company.',
  })
  @ApiOkResponse({
    description: 'Sale contracts were returned.',
    type: SaleContractsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company sales or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listSaleContracts(
    @Param('companyId') companyId: string,
    @Query() query: SaleContractsListQueryDto,
  ) {
    return this.saleContractsService.listSaleContracts(companyId, query);
  }

  @Get(':saleContractId')
  @ApiOperation({
    summary: 'Return sale contract detail.',
  })
  @ApiOkResponse({
    description: 'Sale contract detail was returned.',
    type: SaleContractDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or sale contract was not found.',
    type: ApiErrorResponseDto,
  })
  getSaleContract(
    @Param('companyId') companyId: string,
    @Param('saleContractId') saleContractId: string,
  ) {
    return this.saleContractsService.getSaleContractDetail(
      companyId,
      saleContractId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a sale contract from a booking.',
  })
  @ApiCreatedResponse({
    description: 'Sale contract was created.',
    type: SaleContractDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the contract violates the allowed booking and unit state rules.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A sale contract already exists for the requested booking.',
    type: ApiErrorResponseDto,
  })
  createSaleContract(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createSaleContractDto: CreateSaleContractDto,
  ) {
    return this.saleContractsService.createSaleContract(
      companyId,
      authenticatedUser.id,
      requestId,
      createSaleContractDto,
    );
  }

  @Patch(':saleContractId')
  @ApiOperation({
    summary: 'Update the safe editable sale contract metadata.',
  })
  @ApiOkResponse({
    description: 'Sale contract was updated.',
    type: SaleContractDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the contract change is not allowed.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or sale contract was not found.',
    type: ApiErrorResponseDto,
  })
  updateSaleContract(
    @Param('companyId') companyId: string,
    @Param('saleContractId') saleContractId: string,
    @Body() updateSaleContractDto: UpdateSaleContractDto,
  ) {
    return this.saleContractsService.updateSaleContract(
      companyId,
      saleContractId,
      updateSaleContractDto,
    );
  }
}
