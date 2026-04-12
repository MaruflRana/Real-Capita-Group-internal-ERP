import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

export class AttendanceDevicesListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;
}

export class CreateAttendanceDeviceDto {
  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;
}

export class UpdateAttendanceDeviceDto {
  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;
}

export class AttendanceDeviceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

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
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AttendanceDevicesListResponseDto {
  @ApiProperty({
    type: () => [AttendanceDeviceDto],
  })
  items!: AttendanceDeviceDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
