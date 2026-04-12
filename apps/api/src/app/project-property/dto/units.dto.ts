import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

export class UnitsListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  blockId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitStatusId?: string;
}

export class CreateUnitDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  phaseId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  blockId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string | null;

  @ApiProperty()
  @IsUUID()
  unitTypeId!: string;

  @ApiProperty()
  @IsUUID()
  unitStatusId!: string;

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
}

export class UpdateUnitDto {
  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  phaseId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  blockId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitStatusId?: string;

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
}

export class UnitDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  projectCode!: string;

  @ApiProperty()
  projectName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  phaseId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  phaseCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  phaseName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  blockId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  blockCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  blockName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  zoneId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  zoneCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  zoneName!: string | null;

  @ApiProperty()
  unitTypeId!: string;

  @ApiProperty()
  unitTypeCode!: string;

  @ApiProperty()
  unitTypeName!: string;

  @ApiProperty()
  unitStatusId!: string;

  @ApiProperty()
  unitStatusCode!: string;

  @ApiProperty()
  unitStatusName!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class UnitsListResponseDto {
  @ApiProperty({
    type: () => [UnitDto],
  })
  items!: UnitDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
