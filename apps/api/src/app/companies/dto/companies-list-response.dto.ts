import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { CompanyDto } from './company.dto';

export class CompaniesListResponseDto {
  @ApiProperty({
    type: () => [CompanyDto],
  })
  items!: CompanyDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
