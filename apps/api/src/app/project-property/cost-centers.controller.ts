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

import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CostCenterDto,
  CostCentersListQueryDto,
  CostCentersListResponseDto,
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-centers.dto';
import { ProjectMastersService } from './projects.service';

@ApiTags('cost-centers')
@Controller('companies/:companyId/cost-centers')
@RequireCompanyAdminAccess()
export class CostCentersController {
  constructor(private readonly projectMastersService: ProjectMastersService) {}

  @Get()
  @ApiOperation({
    summary: 'List cost centers for a company.',
  })
  @ApiOkResponse({
    description: 'Cost centers were returned.',
    type: CostCentersListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listCostCenters(
    @Param('companyId') companyId: string,
    @Query() query: CostCentersListQueryDto,
  ) {
    return this.projectMastersService.listCostCenters(companyId, query);
  }

  @Get(':costCenterId')
  @ApiOperation({
    summary: 'Return cost center detail.',
  })
  @ApiOkResponse({
    description: 'Cost center detail was returned.',
    type: CostCenterDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or cost center was not found.',
    type: ApiErrorResponseDto,
  })
  getCostCenter(
    @Param('companyId') companyId: string,
    @Param('costCenterId') costCenterId: string,
  ) {
    return this.projectMastersService.getCostCenterDetail(companyId, costCenterId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a cost center for a company.',
  })
  @ApiCreatedResponse({
    description: 'Cost center was created.',
    type: CostCenterDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The cost center code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createCostCenter(
    @Param('companyId') companyId: string,
    @Body() createCostCenterDto: CreateCostCenterDto,
  ) {
    return this.projectMastersService.createCostCenter(
      companyId,
      createCostCenterDto,
    );
  }

  @Patch(':costCenterId')
  @ApiOperation({
    summary: 'Update a cost center.',
  })
  @ApiOkResponse({
    description: 'Cost center was updated.',
    type: CostCenterDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The cost center code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, cost center, or project was not found.',
    type: ApiErrorResponseDto,
  })
  updateCostCenter(
    @Param('companyId') companyId: string,
    @Param('costCenterId') costCenterId: string,
    @Body() updateCostCenterDto: UpdateCostCenterDto,
  ) {
    return this.projectMastersService.updateCostCenter(
      companyId,
      costCenterId,
      updateCostCenterDto,
    );
  }

  @Post(':costCenterId/activate')
  @ApiOperation({
    summary: 'Activate a cost center.',
  })
  @ApiOkResponse({
    description: 'Cost center was activated.',
    type: CostCenterDto,
  })
  activateCostCenter(
    @Param('companyId') companyId: string,
    @Param('costCenterId') costCenterId: string,
  ) {
    return this.projectMastersService.setCostCenterActiveState(
      companyId,
      costCenterId,
      true,
    );
  }

  @Post(':costCenterId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a cost center.',
  })
  @ApiOkResponse({
    description: 'Cost center was deactivated.',
    type: CostCenterDto,
  })
  deactivateCostCenter(
    @Param('companyId') companyId: string,
    @Param('costCenterId') costCenterId: string,
  ) {
    return this.projectMastersService.setCostCenterActiveState(
      companyId,
      costCenterId,
      false,
    );
  }
}
