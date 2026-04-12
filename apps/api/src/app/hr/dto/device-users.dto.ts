import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

export class DeviceUsersListQueryDto extends ActiveFilterQueryDto {
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
  locationId?: string;
}

export class CreateDeviceUserDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty()
  @IsUUID()
  attendanceDeviceId!: string;

  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  deviceEmployeeCode!: string;
}

export class UpdateDeviceUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  attendanceDeviceId?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  deviceEmployeeCode?: string;
}

export class DeviceUserDto {
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
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class DeviceUsersListResponseDto {
  @ApiProperty({
    type: () => [DeviceUserDto],
  })
  items!: DeviceUserDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
