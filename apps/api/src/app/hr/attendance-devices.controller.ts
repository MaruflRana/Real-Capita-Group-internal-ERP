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

import { RequireCompanyHrAccess } from '../auth/decorators/require-company-hr-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  AttendanceDeviceDto,
  AttendanceDevicesListQueryDto,
  AttendanceDevicesListResponseDto,
  CreateAttendanceDeviceDto,
  UpdateAttendanceDeviceDto,
} from './dto/attendance-devices.dto';
import { AttendanceDevicesService } from './attendance-devices.service';

@ApiTags('attendance-devices')
@Controller('companies/:companyId/attendance-devices')
@RequireCompanyHrAccess()
export class AttendanceDevicesController {
  constructor(
    private readonly attendanceDevicesService: AttendanceDevicesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List attendance devices for a company.',
  })
  @ApiOkResponse({
    description: 'Attendance devices were returned.',
    type: AttendanceDevicesListResponseDto,
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
  listAttendanceDevices(
    @Param('companyId') companyId: string,
    @Query() query: AttendanceDevicesListQueryDto,
  ) {
    return this.attendanceDevicesService.listAttendanceDevices(companyId, query);
  }

  @Get(':attendanceDeviceId')
  @ApiOperation({
    summary: 'Return attendance device detail.',
  })
  @ApiOkResponse({
    description: 'Attendance device detail was returned.',
    type: AttendanceDeviceDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or attendance device was not found.',
    type: ApiErrorResponseDto,
  })
  getAttendanceDevice(
    @Param('companyId') companyId: string,
    @Param('attendanceDeviceId') attendanceDeviceId: string,
  ) {
    return this.attendanceDevicesService.getAttendanceDeviceDetail(
      companyId,
      attendanceDeviceId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create an attendance device.',
  })
  @ApiCreatedResponse({
    description: 'Attendance device was created.',
    type: AttendanceDeviceDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or linked location is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The attendance device code already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createAttendanceDevice(
    @Param('companyId') companyId: string,
    @Body() createAttendanceDeviceDto: CreateAttendanceDeviceDto,
  ) {
    return this.attendanceDevicesService.createAttendanceDevice(
      companyId,
      createAttendanceDeviceDto,
    );
  }

  @Patch(':attendanceDeviceId')
  @ApiOperation({
    summary: 'Update an attendance device.',
  })
  @ApiOkResponse({
    description: 'Attendance device was updated.',
    type: AttendanceDeviceDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or linked location is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The attendance device code already exists in the company.',
    type: ApiErrorResponseDto,
  })
  updateAttendanceDevice(
    @Param('companyId') companyId: string,
    @Param('attendanceDeviceId') attendanceDeviceId: string,
    @Body() updateAttendanceDeviceDto: UpdateAttendanceDeviceDto,
  ) {
    return this.attendanceDevicesService.updateAttendanceDevice(
      companyId,
      attendanceDeviceId,
      updateAttendanceDeviceDto,
    );
  }

  @Post(':attendanceDeviceId/activate')
  @ApiOperation({
    summary: 'Activate an attendance device.',
  })
  @ApiOkResponse({
    description: 'Attendance device was activated.',
    type: AttendanceDeviceDto,
  })
  activateAttendanceDevice(
    @Param('companyId') companyId: string,
    @Param('attendanceDeviceId') attendanceDeviceId: string,
  ) {
    return this.attendanceDevicesService.setAttendanceDeviceActiveState(
      companyId,
      attendanceDeviceId,
      true,
    );
  }

  @Post(':attendanceDeviceId/deactivate')
  @ApiOperation({
    summary: 'Deactivate an attendance device.',
  })
  @ApiOkResponse({
    description: 'Attendance device was deactivated.',
    type: AttendanceDeviceDto,
  })
  deactivateAttendanceDevice(
    @Param('companyId') companyId: string,
    @Param('attendanceDeviceId') attendanceDeviceId: string,
  ) {
    return this.attendanceDevicesService.setAttendanceDeviceActiveState(
      companyId,
      attendanceDeviceId,
      false,
    );
  }
}
