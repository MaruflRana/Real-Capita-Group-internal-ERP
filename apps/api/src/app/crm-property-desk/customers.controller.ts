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

import { RequireCompanySalesAccess } from '../auth/decorators/require-company-sales-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  CustomerDto,
  CustomersListQueryDto,
  CustomersListResponseDto,
  UpdateCustomerDto,
} from './dto/customers.dto';

@ApiTags('customers')
@Controller('companies/:companyId/customers')
@RequireCompanySalesAccess()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({
    summary: 'List customers for a company.',
  })
  @ApiOkResponse({
    description: 'Customers were returned.',
    type: CustomersListResponseDto,
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
  listCustomers(
    @Param('companyId') companyId: string,
    @Query() query: CustomersListQueryDto,
  ) {
    return this.customersService.listCustomers(companyId, query);
  }

  @Get(':customerId')
  @ApiOperation({
    summary: 'Return customer detail.',
  })
  @ApiOkResponse({
    description: 'Customer detail was returned.',
    type: CustomerDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or customer was not found.',
    type: ApiErrorResponseDto,
  })
  getCustomer(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.getCustomerDetail(companyId, customerId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a customer for a company.',
  })
  @ApiCreatedResponse({
    description: 'Customer was created.',
    type: CustomerDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The customer email or phone already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createCustomer(
    @Param('companyId') companyId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.createCustomer(companyId, createCustomerDto);
  }

  @Patch(':customerId')
  @ApiOperation({
    summary: 'Update a customer.',
  })
  @ApiOkResponse({
    description: 'Customer was updated.',
    type: CustomerDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The customer email or phone already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or customer was not found.',
    type: ApiErrorResponseDto,
  })
  updateCustomer(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(
      companyId,
      customerId,
      updateCustomerDto,
    );
  }

  @Post(':customerId/activate')
  @ApiOperation({
    summary: 'Activate a customer.',
  })
  @ApiOkResponse({
    description: 'Customer was activated.',
    type: CustomerDto,
  })
  activateCustomer(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.setCustomerActiveState(
      companyId,
      customerId,
      true,
    );
  }

  @Post(':customerId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a customer.',
  })
  @ApiOkResponse({
    description: 'Customer was deactivated.',
    type: CustomerDto,
  })
  deactivateCustomer(
    @Param('companyId') companyId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.setCustomerActiveState(
      companyId,
      customerId,
      false,
    );
  }
}
