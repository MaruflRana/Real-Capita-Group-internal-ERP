import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import { HR_ATTENDANCE_LOG_DIRECTIONS } from '../constants/hr.constants';

export class AttendanceLogsListQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  attendanceDeviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deviceUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({
    enum: HR_ATTENDANCE_LOG_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(HR_ATTENDANCE_LOG_DIRECTIONS)
  direction?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for loggedAt in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound for loggedAt in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  dateTo?: string;
}

export class CreateAttendanceLogDto {
  @ApiProperty()
  @IsUUID()
  deviceUserId!: string;

  @ApiProperty({
    description: 'Attendance timestamp as an ISO 8601 date-time string.',
  })
  @IsDateString()
  loggedAt!: string;

  @ApiPropertyOptional({
    enum: HR_ATTENDANCE_LOG_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(HR_ATTENDANCE_LOG_DIRECTIONS)
  direction?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalLogId?: string | null;
}

export class BulkCreateAttendanceLogsDto {
  @ApiProperty({
    type: () => [CreateAttendanceLogDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateAttendanceLogDto)
  entries!: CreateAttendanceLogDto[];
}

export class AttendanceLogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  deviceUserId!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  employeeFullName!: string;

  @ApiProperty()
  attendanceDeviceId!: string;

  @ApiProperty()
  attendanceDeviceCode!: string;

  @ApiProperty()
  attendanceDeviceName!: string;

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
  deviceEmployeeCode!: string;

  @ApiProperty()
  loggedAt!: string;

  @ApiProperty({
    enum: HR_ATTENDANCE_LOG_DIRECTIONS,
  })
  direction!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  externalLogId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AttendanceLogsListResponseDto {
  @ApiProperty({
    type: () => [AttendanceLogDto],
  })
  items!: AttendanceLogDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}

export class BulkAttendanceLogsResultDto {
  @ApiProperty()
  createdCount!: number;

  @ApiProperty()
  skippedCount!: number;
}
