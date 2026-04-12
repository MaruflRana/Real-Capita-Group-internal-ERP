import {
  Body,
  Controller,
  Get,
  Param,
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

import { RequireCompanyHrAccess } from '../auth/decorators/require-company-hr-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  AttendanceLogDto,
  AttendanceLogsListQueryDto,
  AttendanceLogsListResponseDto,
  BulkAttendanceLogsResultDto,
  BulkCreateAttendanceLogsDto,
  CreateAttendanceLogDto,
} from './dto/attendance-logs.dto';
import { AttendanceLogsService } from './attendance-logs.service';

@ApiTags('attendance-logs')
@Controller('companies/:companyId/attendance-logs')
@RequireCompanyHrAccess()
export class AttendanceLogsController {
  constructor(private readonly attendanceLogsService: AttendanceLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List attendance logs for a company.',
  })
  @ApiOkResponse({
    description: 'Attendance logs were returned.',
    type: AttendanceLogsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company HR or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listAttendanceLogs(
    @Param('companyId') companyId: string,
    @Query() query: AttendanceLogsListQueryDto,
  ) {
    return this.attendanceLogsService.listAttendanceLogs(companyId, query);
  }

  @Get(':attendanceLogId')
  @ApiOperation({
    summary: 'Return attendance log detail.',
  })
  @ApiOkResponse({
    description: 'Attendance log detail was returned.',
    type: AttendanceLogDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or attendance log was not found.',
    type: ApiErrorResponseDto,
  })
  getAttendanceLog(
    @Param('companyId') companyId: string,
    @Param('attendanceLogId') attendanceLogId: string,
  ) {
    return this.attendanceLogsService.getAttendanceLogDetail(
      companyId,
      attendanceLogId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a single attendance log entry.',
  })
  @ApiCreatedResponse({
    description: 'Attendance log was created.',
    type: AttendanceLogDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the attendance mapping was invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The attendance log conflicts with an existing log.',
    type: ApiErrorResponseDto,
  })
  createAttendanceLog(
    @Param('companyId') companyId: string,
    @Body() createAttendanceLogDto: CreateAttendanceLogDto,
  ) {
    return this.attendanceLogsService.createAttendanceLog(
      companyId,
      createAttendanceLogDto,
    );
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Bulk ingest attendance log entries.',
  })
  @ApiCreatedResponse({
    description: 'Attendance logs were ingested.',
    type: BulkAttendanceLogsResultDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for one or more attendance log entries.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'One or more attendance mappings were not found.',
    type: ApiErrorResponseDto,
  })
  bulkCreateAttendanceLogs(
    @Param('companyId') companyId: string,
    @Body() bulkCreateAttendanceLogsDto: BulkCreateAttendanceLogsDto,
  ) {
    return this.attendanceLogsService.bulkCreateAttendanceLogs(
      companyId,
      bulkCreateAttendanceLogsDto,
    );
  }
}
