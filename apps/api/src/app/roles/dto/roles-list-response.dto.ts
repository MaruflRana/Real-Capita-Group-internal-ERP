import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { RoleDto } from './role.dto';

export class RolesListResponseDto {
  @ApiProperty({
    type: () => [RoleDto],
  })
  items!: RoleDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
