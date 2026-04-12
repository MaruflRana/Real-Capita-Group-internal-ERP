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

export class BlocksListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  phaseId?: string;
}

export class CreateBlockDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  phaseId?: string | null;

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

export class UpdateBlockDto {
  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  phaseId?: string | null;

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

export class BlockDto {
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

export class BlocksListResponseDto {
  @ApiProperty({
    type: () => [BlockDto],
  })
  items!: BlockDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
