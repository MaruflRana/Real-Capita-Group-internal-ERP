import { ApiProperty } from '@nestjs/swagger';

import { ACCOUNTING_NATURAL_BALANCES } from '../../common/constants/accounting.constants';
import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class AccountClassesListQueryDto extends ActiveFilterQueryDto {}

export class AccountClassDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    enum: ACCOUNTING_NATURAL_BALANCES,
  })
  naturalBalance!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AccountClassesListResponseDto {
  @ApiProperty({
    type: () => [AccountClassDto],
  })
  items!: AccountClassDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
