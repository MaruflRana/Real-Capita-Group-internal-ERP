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
  CreateUnitDto,
  UnitDto,
  UnitsListQueryDto,
  UnitsListResponseDto,
  UpdateUnitDto,
} from './dto/units.dto';
import { UnitsService } from './units.service';

@ApiTags('units')
@Controller('companies/:companyId/units')
@RequireCompanyAdminAccess()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @ApiOperation({
    summary: 'List units for a company.',
  })
  @ApiOkResponse({
    description: 'Units were returned.',
    type: UnitsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listUnits(
    @Param('companyId') companyId: string,
    @Query() query: UnitsListQueryDto,
  ) {
    return this.unitsService.listUnits(companyId, query);
  }

  @Get(':unitId')
  @ApiOperation({
    summary: 'Return unit detail.',
  })
  @ApiOkResponse({
    description: 'Unit detail was returned.',
    type: UnitDto,
  })
  getUnit(
    @Param('companyId') companyId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.unitsService.getUnitDetail(companyId, unitId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a unit.',
  })
  @ApiCreatedResponse({
    description: 'Unit was created.',
    type: UnitDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the selected hierarchy is inconsistent.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The unit code already exists in the project.',
    type: ApiErrorResponseDto,
  })
  createUnit(
    @Param('companyId') companyId: string,
    @Body() createUnitDto: CreateUnitDto,
  ) {
    return this.unitsService.createUnit(companyId, createUnitDto);
  }

  @Patch(':unitId')
  @ApiOperation({
    summary: 'Update a unit.',
  })
  @ApiOkResponse({
    description: 'Unit was updated.',
    type: UnitDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the selected hierarchy is inconsistent.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The unit code already exists in the project.',
    type: ApiErrorResponseDto,
  })
  updateUnit(
    @Param('companyId') companyId: string,
    @Param('unitId') unitId: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.updateUnit(companyId, unitId, updateUnitDto);
  }

  @Post(':unitId/activate')
  @ApiOperation({
    summary: 'Activate a unit.',
  })
  @ApiOkResponse({
    description: 'Unit was activated.',
    type: UnitDto,
  })
  activateUnit(
    @Param('companyId') companyId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.unitsService.setUnitActiveState(companyId, unitId, true);
  }

  @Post(':unitId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a unit.',
  })
  @ApiOkResponse({
    description: 'Unit was deactivated.',
    type: UnitDto,
  })
  deactivateUnit(
    @Param('companyId') companyId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.unitsService.setUnitActiveState(companyId, unitId, false);
  }
}
