import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  UnitStatusesListQueryDto,
  UnitStatusesListResponseDto,
} from './dto/unit-statuses.dto';
import { UnitsService } from './units.service';

@ApiTags('unit-statuses')
@Controller('companies/:companyId/unit-statuses')
@RequireCompanyAdminAccess()
export class UnitStatusesController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @ApiOperation({
    summary: 'List fixed unit statuses.',
  })
  @ApiOkResponse({
    description: 'Unit statuses were returned.',
    type: UnitStatusesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listUnitStatuses(
    @Param('companyId') companyId: string,
    @Query() query: UnitStatusesListQueryDto,
  ) {
    return this.unitsService.listUnitStatuses(companyId, query);
  }
}
