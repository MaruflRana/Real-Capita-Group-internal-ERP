import {
  Body,
  Controller,
  Delete,
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

import { RequireCompanySalesAccess } from '../auth/decorators/require-company-sales-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateInstallmentSchedulesDto,
  InstallmentScheduleDto,
  InstallmentSchedulesListQueryDto,
  InstallmentSchedulesListResponseDto,
  UpdateInstallmentScheduleDto,
} from './dto/installment-schedules.dto';
import { InstallmentSchedulesService } from './installment-schedules.service';

@ApiTags('installment-schedules')
@Controller('companies/:companyId/installment-schedules')
@RequireCompanySalesAccess()
export class InstallmentSchedulesController {
  constructor(
    private readonly installmentSchedulesService: InstallmentSchedulesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List installment schedules for a company.',
  })
  @ApiOkResponse({
    description: 'Installment schedules were returned.',
    type: InstallmentSchedulesListResponseDto,
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
  listInstallmentSchedules(
    @Param('companyId') companyId: string,
    @Query() query: InstallmentSchedulesListQueryDto,
  ) {
    return this.installmentSchedulesService.listInstallmentSchedules(
      companyId,
      query,
    );
  }

  @Get(':installmentScheduleId')
  @ApiOperation({
    summary: 'Return installment schedule detail.',
  })
  @ApiOkResponse({
    description: 'Installment schedule detail was returned.',
    type: InstallmentScheduleDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or installment schedule was not found.',
    type: ApiErrorResponseDto,
  })
  getInstallmentSchedule(
    @Param('companyId') companyId: string,
    @Param('installmentScheduleId') installmentScheduleId: string,
  ) {
    return this.installmentSchedulesService.getInstallmentScheduleDetail(
      companyId,
      installmentScheduleId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create installment schedule rows for a sale contract.',
  })
  @ApiCreatedResponse({
    description: 'Installment schedules were created.',
    type: InstallmentSchedulesListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'A schedule sequence number already exists for the requested sale contract.',
    type: ApiErrorResponseDto,
  })
  createInstallmentSchedules(
    @Param('companyId') companyId: string,
    @Body() createInstallmentSchedulesDto: CreateInstallmentSchedulesDto,
  ) {
    return this.installmentSchedulesService.createInstallmentSchedules(
      companyId,
      createInstallmentSchedulesDto,
    );
  }

  @Patch(':installmentScheduleId')
  @ApiOperation({
    summary: 'Update an installment schedule row while it is still safe to edit.',
  })
  @ApiOkResponse({
    description: 'Installment schedule was updated.',
    type: InstallmentScheduleDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the schedule already has linked collections.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or installment schedule was not found.',
    type: ApiErrorResponseDto,
  })
  updateInstallmentSchedule(
    @Param('companyId') companyId: string,
    @Param('installmentScheduleId') installmentScheduleId: string,
    @Body() updateInstallmentScheduleDto: UpdateInstallmentScheduleDto,
  ) {
    return this.installmentSchedulesService.updateInstallmentSchedule(
      companyId,
      installmentScheduleId,
      updateInstallmentScheduleDto,
    );
  }

  @Delete(':installmentScheduleId')
  @ApiOperation({
    summary: 'Remove an installment schedule row while it is still safe to remove.',
  })
  @ApiOkResponse({
    description: 'Installment schedule was removed.',
    type: InstallmentScheduleDto,
  })
  @ApiBadRequestResponse({
    description:
      'The schedule already has linked collections and cannot be removed.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or installment schedule was not found.',
    type: ApiErrorResponseDto,
  })
  removeInstallmentSchedule(
    @Param('companyId') companyId: string,
    @Param('installmentScheduleId') installmentScheduleId: string,
  ) {
    return this.installmentSchedulesService.removeInstallmentSchedule(
      companyId,
      installmentScheduleId,
    );
  }
}
