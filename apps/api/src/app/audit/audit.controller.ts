import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { AuditService } from './audit.service';
import {
  AuditEventDto,
  AuditEventsListQueryDto,
  AuditEventsListResponseDto,
} from './dto/audit-events.dto';

@ApiTags('audit-events')
@Controller('companies/:companyId/audit-events')
@RequireCompanyAdminAccess()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'List company-scoped audit events.',
  })
  @ApiOkResponse({
    description: 'Audit events were returned.',
    type: AuditEventsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Company admin access is required for audit trail reads.',
    type: ApiErrorResponseDto,
  })
  listAuditEvents(
    @Param('companyId') companyId: string,
    @Query() query: AuditEventsListQueryDto,
  ) {
    return this.auditService.listAuditEvents(companyId, query);
  }

  @Get(':auditEventId')
  @ApiOperation({
    summary: 'Return audit event detail.',
  })
  @ApiOkResponse({
    description: 'Audit event detail was returned.',
    type: AuditEventDto,
  })
  @ApiForbiddenResponse({
    description: 'Company admin access is required for audit trail reads.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or audit event was not found.',
    type: ApiErrorResponseDto,
  })
  getAuditEventDetail(
    @Param('companyId') companyId: string,
    @Param('auditEventId') auditEventId: string,
  ) {
    return this.auditService.getAuditEventDetail(companyId, auditEventId);
  }
}
