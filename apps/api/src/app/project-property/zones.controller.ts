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
  CreateZoneDto,
  UpdateZoneDto,
  ZoneDto,
  ZonesListQueryDto,
  ZonesListResponseDto,
} from './dto/zones.dto';
import { ProjectHierarchyService } from './project-hierarchy.service';

@ApiTags('zones')
@Controller('companies/:companyId/zones')
@RequireCompanyAdminAccess()
export class ZonesController {
  constructor(private readonly projectHierarchyService: ProjectHierarchyService) {}

  @Get()
  @ApiOperation({
    summary: 'List zones for a company.',
  })
  @ApiOkResponse({
    description: 'Zones were returned.',
    type: ZonesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listZones(
    @Param('companyId') companyId: string,
    @Query() query: ZonesListQueryDto,
  ) {
    return this.projectHierarchyService.listZones(companyId, query);
  }

  @Get(':zoneId')
  @ApiOperation({
    summary: 'Return zone detail.',
  })
  @ApiOkResponse({
    description: 'Zone detail was returned.',
    type: ZoneDto,
  })
  getZone(
    @Param('companyId') companyId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.projectHierarchyService.getZoneDetail(companyId, zoneId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a zone.',
  })
  @ApiCreatedResponse({
    description: 'Zone was created.',
    type: ZoneDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the selected parent is inactive.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The zone code or name already exists in the project.',
    type: ApiErrorResponseDto,
  })
  createZone(
    @Param('companyId') companyId: string,
    @Body() createZoneDto: CreateZoneDto,
  ) {
    return this.projectHierarchyService.createZone(companyId, createZoneDto);
  }

  @Patch(':zoneId')
  @ApiOperation({
    summary: 'Update a zone.',
  })
  @ApiOkResponse({
    description: 'Zone was updated.',
    type: ZoneDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the selected parent is inactive.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The zone code or name already exists in the project.',
    type: ApiErrorResponseDto,
  })
  updateZone(
    @Param('companyId') companyId: string,
    @Param('zoneId') zoneId: string,
    @Body() updateZoneDto: UpdateZoneDto,
  ) {
    return this.projectHierarchyService.updateZone(
      companyId,
      zoneId,
      updateZoneDto,
    );
  }

  @Post(':zoneId/activate')
  @ApiOperation({
    summary: 'Activate a zone.',
  })
  @ApiOkResponse({
    description: 'Zone was activated.',
    type: ZoneDto,
  })
  activateZone(
    @Param('companyId') companyId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.projectHierarchyService.setZoneActiveState(companyId, zoneId, true);
  }

  @Post(':zoneId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a zone.',
  })
  @ApiOkResponse({
    description: 'Zone was deactivated.',
    type: ZoneDto,
  })
  deactivateZone(
    @Param('companyId') companyId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.projectHierarchyService.setZoneActiveState(
      companyId,
      zoneId,
      false,
    );
  }
}
