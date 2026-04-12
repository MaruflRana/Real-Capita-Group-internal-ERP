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

export class ProjectPhasesListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

export class CreateProjectPhaseDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

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

export class UpdateProjectPhaseDto {
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

export class ProjectPhaseDto {
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

export class ProjectPhasesListResponseDto {
  @ApiProperty({
    type: () => [ProjectPhaseDto],
  })
  items!: ProjectPhaseDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
