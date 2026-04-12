import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { LocationDto } from './location.dto';

export class LocationsListResponseDto {
  @ApiProperty({
    type: () => [LocationDto],
  })
  items!: LocationDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
