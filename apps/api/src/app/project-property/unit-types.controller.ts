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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateUnitTypeDto,
  UnitTypeDto,
  UnitTypesListQueryDto,
  UnitTypesListResponseDto,
  UpdateUnitTypeDto,
} from './dto/unit-types.dto';
import { UnitsService } from './units.service';

@ApiTags('unit-types')
@Controller('companies/:companyId/unit-types')
@RequireCompanyAdminAccess()
export class UnitTypesController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @ApiOperation({
    summary: 'List unit types for a company.',
  })
  @ApiOkResponse({
    description: 'Unit types were returned.',
    type: UnitTypesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listUnitTypes(
    @Param('companyId') companyId: string,
    @Query() query: UnitTypesListQueryDto,
  ) {
    return this.unitsService.listUnitTypes(companyId, query);
  }

  @Get(':unitTypeId')
  @ApiOperation({
    summary: 'Return unit type detail.',
  })
  @ApiOkResponse({
    description: 'Unit type detail was returned.',
    type: UnitTypeDto,
  })
  getUnitType(
    @Param('companyId') companyId: string,
    @Param('unitTypeId') unitTypeId: string,
  ) {
    return this.unitsService.getUnitTypeDetail(companyId, unitTypeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a unit type.',
  })
  @ApiCreatedResponse({
    description: 'Unit type was created.',
    type: UnitTypeDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The unit type code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createUnitType(
    @Param('companyId') companyId: string,
    @Body() createUnitTypeDto: CreateUnitTypeDto,
  ) {
    return this.unitsService.createUnitType(companyId, createUnitTypeDto);
  }

  @Patch(':unitTypeId')
  @ApiOperation({
    summary: 'Update a unit type.',
  })
  @ApiOkResponse({
    description: 'Unit type was updated.',
    type: UnitTypeDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The unit type code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  updateUnitType(
    @Param('companyId') companyId: string,
    @Param('unitTypeId') unitTypeId: string,
    @Body() updateUnitTypeDto: UpdateUnitTypeDto,
  ) {
    return this.unitsService.updateUnitType(
      companyId,
      unitTypeId,
      updateUnitTypeDto,
    );
  }

  @Post(':unitTypeId/activate')
  @ApiOperation({
    summary: 'Activate a unit type.',
  })
  @ApiOkResponse({
    description: 'Unit type was activated.',
    type: UnitTypeDto,
  })
  activateUnitType(
    @Param('companyId') companyId: string,
    @Param('unitTypeId') unitTypeId: string,
  ) {
    return this.unitsService.setUnitTypeActiveState(companyId, unitTypeId, true);
  }

  @Post(':unitTypeId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a unit type.',
  })
  @ApiOkResponse({
    description: 'Unit type was deactivated.',
    type: UnitTypeDto,
  })
  deactivateUnitType(
    @Param('companyId') companyId: string,
    @Param('unitTypeId') unitTypeId: string,
  ) {
    return this.unitsService.setUnitTypeActiveState(
      companyId,
      unitTypeId,
      false,
    );
  }
}
