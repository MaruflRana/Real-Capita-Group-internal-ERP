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
  CreateLeaveTypeDto,
  LeaveTypeDto,
  LeaveTypesListQueryDto,
  LeaveTypesListResponseDto,
  UpdateLeaveTypeDto,
} from './dto/leave-types.dto';
import { LeaveTypesService } from './leave-types.service';

@ApiTags('leave-types')
@Controller('companies/:companyId/leave-types')
@RequireCompanyHrAccess()
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get()
  @ApiOperation({
    summary: 'List leave types for a company.',
  })
  @ApiOkResponse({
    description: 'Leave types were returned.',
    type: LeaveTypesListResponseDto,
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
  listLeaveTypes(
    @Param('companyId') companyId: string,
    @Query() query: LeaveTypesListQueryDto,
  ) {
    return this.leaveTypesService.listLeaveTypes(companyId, query);
  }

  @Get(':leaveTypeId')
  @ApiOperation({
    summary: 'Return leave type detail.',
  })
  @ApiOkResponse({
    description: 'Leave type detail was returned.',
    type: LeaveTypeDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or leave type was not found.',
    type: ApiErrorResponseDto,
  })
  getLeaveType(
    @Param('companyId') companyId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.leaveTypesService.getLeaveTypeDetail(companyId, leaveTypeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a leave type.',
  })
  @ApiCreatedResponse({
    description: 'Leave type was created.',
    type: LeaveTypeDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The leave type code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createLeaveType(
    @Param('companyId') companyId: string,
    @Body() createLeaveTypeDto: CreateLeaveTypeDto,
  ) {
    return this.leaveTypesService.createLeaveType(companyId, createLeaveTypeDto);
  }

  @Patch(':leaveTypeId')
  @ApiOperation({
    summary: 'Update a leave type.',
  })
  @ApiOkResponse({
    description: 'Leave type was updated.',
    type: LeaveTypeDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The leave type code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  updateLeaveType(
    @Param('companyId') companyId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leaveTypesService.updateLeaveType(
      companyId,
      leaveTypeId,
      updateLeaveTypeDto,
    );
  }

  @Post(':leaveTypeId/activate')
  @ApiOperation({
    summary: 'Activate a leave type.',
  })
  @ApiOkResponse({
    description: 'Leave type was activated.',
    type: LeaveTypeDto,
  })
  activateLeaveType(
    @Param('companyId') companyId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.leaveTypesService.setLeaveTypeActiveState(
      companyId,
      leaveTypeId,
      true,
    );
  }

  @Post(':leaveTypeId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a leave type.',
  })
  @ApiOkResponse({
    description: 'Leave type was deactivated.',
    type: LeaveTypeDto,
  })
  deactivateLeaveType(
    @Param('companyId') companyId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.leaveTypesService.setLeaveTypeActiveState(
      companyId,
      leaveTypeId,
      false,
    );
  }
}
