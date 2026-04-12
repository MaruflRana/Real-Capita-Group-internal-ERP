import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { CompanyUserDto } from './company-user.dto';

export class CompanyUsersListResponseDto {
  @ApiProperty({
    type: () => [CompanyUserDto],
  })
  items!: CompanyUserDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
