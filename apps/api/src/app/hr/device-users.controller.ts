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
  CreateDeviceUserDto,
  DeviceUserDto,
  DeviceUsersListQueryDto,
  DeviceUsersListResponseDto,
  UpdateDeviceUserDto,
} from './dto/device-users.dto';
import { DeviceUsersService } from './device-users.service';

@ApiTags('device-users')
@Controller('companies/:companyId/device-users')
@RequireCompanyHrAccess()
export class DeviceUsersController {
  constructor(private readonly deviceUsersService: DeviceUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List attendance device user mappings for a company.',
  })
  @ApiOkResponse({
    description: 'Attendance device user mappings were returned.',
    type: DeviceUsersListResponseDto,
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
  listDeviceUsers(
    @Param('companyId') companyId: string,
    @Query() query: DeviceUsersListQueryDto,
  ) {
    return this.deviceUsersService.listDeviceUsers(companyId, query);
  }

  @Get(':deviceUserId')
  @ApiOperation({
    summary: 'Return attendance device user mapping detail.',
  })
  @ApiOkResponse({
    description: 'Attendance device user mapping detail was returned.',
    type: DeviceUserDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or attendance device user mapping was not found.',
    type: ApiErrorResponseDto,
  })
  getDeviceUser(
    @Param('companyId') companyId: string,
    @Param('deviceUserId') deviceUserId: string,
  ) {
    return this.deviceUsersService.getDeviceUserDetail(companyId, deviceUserId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an attendance device user mapping.',
  })
  @ApiCreatedResponse({
    description: 'Attendance device user mapping was created.',
    type: DeviceUserDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the linked employee/device is inactive or invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The attendance mapping conflicts with an existing active mapping.',
    type: ApiErrorResponseDto,
  })
  createDeviceUser(
    @Param('companyId') companyId: string,
    @Body() createDeviceUserDto: CreateDeviceUserDto,
  ) {
    return this.deviceUsersService.createDeviceUser(companyId, createDeviceUserDto);
  }

  @Patch(':deviceUserId')
  @ApiOperation({
    summary: 'Update an attendance device user mapping.',
  })
  @ApiOkResponse({
    description: 'Attendance device user mapping was updated.',
    type: DeviceUserDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the linked employee/device is inactive or invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The attendance mapping conflicts with an existing active mapping.',
    type: ApiErrorResponseDto,
  })
  updateDeviceUser(
    @Param('companyId') companyId: string,
    @Param('deviceUserId') deviceUserId: string,
    @Body() updateDeviceUserDto: UpdateDeviceUserDto,
  ) {
    return this.deviceUsersService.updateDeviceUser(
      companyId,
      deviceUserId,
      updateDeviceUserDto,
    );
  }

  @Post(':deviceUserId/activate')
  @ApiOperation({
    summary: 'Activate an attendance device user mapping.',
  })
  @ApiOkResponse({
    description: 'Attendance device user mapping was activated.',
    type: DeviceUserDto,
  })
  activateDeviceUser(
    @Param('companyId') companyId: string,
    @Param('deviceUserId') deviceUserId: string,
  ) {
    return this.deviceUsersService.setDeviceUserActiveState(
      companyId,
      deviceUserId,
      true,
    );
  }

  @Post(':deviceUserId/deactivate')
  @ApiOperation({
    summary: 'Deactivate an attendance device user mapping.',
  })
  @ApiOkResponse({
    description: 'Attendance device user mapping was deactivated.',
    type: DeviceUserDto,
  })
  deactivateDeviceUser(
    @Param('companyId') companyId: string,
    @Param('deviceUserId') deviceUserId: string,
  ) {
    return this.deviceUsersService.setDeviceUserActiveState(
      companyId,
      deviceUserId,
      false,
    );
  }
}
