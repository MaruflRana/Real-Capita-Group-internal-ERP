import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class UnitStatusesListQueryDto extends ActiveFilterQueryDto {}

export class UnitStatusDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class UnitStatusesListResponseDto {
  @ApiProperty({
    type: () => [UnitStatusDto],
  })
  items!: UnitStatusDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
