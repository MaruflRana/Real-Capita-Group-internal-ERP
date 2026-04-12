import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { RoleAssignmentDto } from './role-assignment.dto';

export class RoleAssignmentsListResponseDto {
  @ApiProperty({
    type: () => [RoleAssignmentDto],
  })
  items!: RoleAssignmentDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
