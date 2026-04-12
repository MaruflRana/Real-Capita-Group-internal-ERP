import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanySalesAccess } from '../auth/decorators/require-company-sales-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  ProjectsListQueryDto,
  ProjectsListResponseDto,
} from '../project-property/dto/projects.dto';
import {
  UnitsListQueryDto,
  UnitsListResponseDto,
} from '../project-property/dto/units.dto';
import {
  VouchersListQueryDto,
  VouchersListResponseDto,
} from '../vouchers/dto/vouchers.dto';
import { CrmPropertyDeskReferenceService } from './crm-property-desk-reference.service';

@ApiTags('crm-property-desk-references')
@Controller('companies/:companyId/crm-property-desk/references')
@RequireCompanySalesAccess()
export class CrmPropertyDeskReferencesController {
  constructor(
    private readonly referenceService: CrmPropertyDeskReferenceService,
  ) {}

  @Get('projects')
  @ApiOperation({
    summary:
      'List project references for CRM/property desk selectors in the active company.',
  })
  @ApiOkResponse({
    description: 'Project references were returned.',
    type: ProjectsListResponseDto,
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
  listProjects(
    @Param('companyId') companyId: string,
    @Query() query: ProjectsListQueryDto,
  ) {
    return this.referenceService.listProjectReferences(companyId, query);
  }

  @Get('units')
  @ApiOperation({
    summary:
      'List unit references for CRM/property desk selectors in the active company.',
  })
  @ApiOkResponse({
    description: 'Unit references were returned.',
    type: UnitsListResponseDto,
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
  listUnits(
    @Param('companyId') companyId: string,
    @Query() query: UnitsListQueryDto,
  ) {
    return this.referenceService.listUnitReferences(companyId, query);
  }

  @Get('vouchers')
  @ApiOperation({
    summary:
      'List posted voucher references for CRM/property desk collection linkage.',
  })
  @ApiOkResponse({
    description: 'Posted voucher references were returned.',
    type: VouchersListResponseDto,
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
  listPostedVouchers(
    @Param('companyId') companyId: string,
    @Query() query: VouchersListQueryDto,
  ) {
    return this.referenceService.listPostedVoucherReferences(companyId, query);
  }
}
