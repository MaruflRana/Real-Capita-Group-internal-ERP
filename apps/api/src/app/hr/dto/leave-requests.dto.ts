import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import { HR_DATE_PATTERN, HR_LEAVE_REQUEST_STATUSES } from '../constants/hr.constants';

export class LeaveRequestsListQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leaveTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({
    enum: HR_LEAVE_REQUEST_STATUSES,
  })
  @IsOptional()
  @IsIn(HR_LEAVE_REQUEST_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for leave startDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(HR_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound for leave endDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(HR_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo?: string;
}

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty()
  @IsUUID()
  leaveTypeId!: string;

  @ApiProperty({
    description: 'Start date in YYYY-MM-DD format.',
  })
  @Matches(HR_DATE_PATTERN, {
    message: 'startDate must be a valid YYYY-MM-DD value.',
  })
  startDate!: string;

  @ApiProperty({
    description: 'End date in YYYY-MM-DD format.',
  })
  @Matches(HR_DATE_PATTERN, {
    message: 'endDate must be a valid YYYY-MM-DD value.',
  })
  endDate!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}

export class UpdateLeaveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leaveTypeId?: string;

  @ApiPropertyOptional({
    description: 'Start date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(HR_DATE_PATTERN, {
    message: 'startDate must be a valid YYYY-MM-DD value.',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(HR_DATE_PATTERN, {
    message: 'endDate must be a valid YYYY-MM-DD value.',
  })
  endDate?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}

export class LeaveRequestActionDto {
  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  decisionNote?: string | null;
}

export class LeaveRequestDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  employeeFullName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationName!: string | null;

  @ApiProperty()
  leaveTypeId!: string;

  @ApiProperty()
  leaveTypeCode!: string;

  @ApiProperty()
  leaveTypeName!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  reason!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  decisionNote!: string | null;

  @ApiProperty({
    enum: HR_LEAVE_REQUEST_STATUSES,
  })
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class LeaveRequestsListResponseDto {
  @ApiProperty({
    type: () => [LeaveRequestDto],
  })
  items!: LeaveRequestDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
