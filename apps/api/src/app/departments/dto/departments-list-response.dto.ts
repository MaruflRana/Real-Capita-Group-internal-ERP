import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { DepartmentDto } from './department.dto';

export class DepartmentsListResponseDto {
  @ApiProperty({
    type: () => [DepartmentDto],
  })
  items!: DepartmentDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
