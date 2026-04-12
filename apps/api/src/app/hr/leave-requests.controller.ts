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
  CreateLeaveRequestDto,
  LeaveRequestActionDto,
  LeaveRequestDto,
  LeaveRequestsListQueryDto,
  LeaveRequestsListResponseDto,
  UpdateLeaveRequestDto,
} from './dto/leave-requests.dto';
import { LeaveRequestsService } from './leave-requests.service';

@ApiTags('leave-requests')
@Controller('companies/:companyId/leave-requests')
@RequireCompanyHrAccess()
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get()
  @ApiOperation({
    summary: 'List leave requests for a company.',
  })
  @ApiOkResponse({
    description: 'Leave requests were returned.',
    type: LeaveRequestsListResponseDto,
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
  listLeaveRequests(
    @Param('companyId') companyId: string,
    @Query() query: LeaveRequestsListQueryDto,
  ) {
    return this.leaveRequestsService.listLeaveRequests(companyId, query);
  }

  @Get(':leaveRequestId')
  @ApiOperation({
    summary: 'Return leave request detail.',
  })
  @ApiOkResponse({
    description: 'Leave request detail was returned.',
    type: LeaveRequestDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or leave request was not found.',
    type: ApiErrorResponseDto,
  })
  getLeaveRequest(
    @Param('companyId') companyId: string,
    @Param('leaveRequestId') leaveRequestId: string,
  ) {
    return this.leaveRequestsService.getLeaveRequestDetail(
      companyId,
      leaveRequestId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a leave request draft.',
  })
  @ApiCreatedResponse({
    description: 'Leave request was created.',
    type: LeaveRequestDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or linked employee/leave type is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The leave request conflicts with an existing leave request.',
    type: ApiErrorResponseDto,
  })
  createLeaveRequest(
    @Param('companyId') companyId: string,
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    return this.leaveRequestsService.createLeaveRequest(
      companyId,
      createLeaveRequestDto,
    );
  }

  @Patch(':leaveRequestId')
  @ApiOperation({
    summary: 'Update a leave request draft.',
  })
  @ApiOkResponse({
    description: 'Leave request was updated.',
    type: LeaveRequestDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the leave request is no longer editable.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The leave request conflicts with an existing leave request.',
    type: ApiErrorResponseDto,
  })
  updateLeaveRequest(
    @Param('companyId') companyId: string,
    @Param('leaveRequestId') leaveRequestId: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
  ) {
    return this.leaveRequestsService.updateLeaveRequest(
      companyId,
      leaveRequestId,
      updateLeaveRequestDto,
    );
  }

  @Post(':leaveRequestId/submit')
  @ApiOperation({
    summary: 'Submit a leave request draft.',
  })
  @ApiOkResponse({
    description: 'Leave request was submitted.',
    type: LeaveRequestDto,
  })
  submitLeaveRequest(
    @Param('companyId') companyId: string,
    @Param('leaveRequestId') leaveRequestId: string,
  ) {
    return this.leaveRequestsService.submitLeaveRequest(
      companyId,
      leaveRequestId,
    );
  }

  @Post(':leaveRequestId/approve')
  @ApiOperation({
    summary: 'Approve a submitted leave request.',
  })
  @ApiOkResponse({
    description: 'Leave request was approved.',
    type: LeaveRequestDto,
  })
  approveLeaveRequest(
    @Param('companyId') companyId: string,
    @Param('leaveRequestId') leaveRequestId: string,
    @Body() leaveRequestActionDto: LeaveRequestActionDto = {},
  ) {
    return this.leaveRequestsService.approveLeaveRequest(
      companyId,
      leaveRequestId,
      leaveRequestActionDto,
    );
  }

  @Post(':leaveRequestId/reject')
  @ApiOperation({
    summary: 'Reject a submitted leave request.',
  })
  @ApiOkResponse({
    description: 'Leave request was rejected.',
    type: LeaveRequestDto,
  })
  rejectLeaveRequest(
    @Param('companyId') companyId: string,
    @Param('leaveRequestId') leaveRequestId: string,
    @Body() leaveRequestActionDto: LeaveRequestActionDto = {},
  ) {
    return this.leaveRequestsService.rejectLeaveRequest(
      companyId,
      leaveRequestId,
      leaveRequestActionDto,
    );
  }

  @Post(':leaveRequestId/cancel')
  @ApiOperation({
    summary: 'Cancel a draft or submitted leave request.',
  })
  @ApiOkResponse({
    description: 'Leave request was cancelled.',
    type: LeaveRequestDto,
  })
  cancelLeaveRequest(
    @Param('companyId') companyId: string,
    @Param('leaveRequestId') leaveRequestId: string,
    @Body() leaveRequestActionDto: LeaveRequestActionDto = {},
  ) {
    return this.leaveRequestsService.cancelLeaveRequest(
      companyId,
      leaveRequestId,
      leaveRequestActionDto,
    );
  }
}
