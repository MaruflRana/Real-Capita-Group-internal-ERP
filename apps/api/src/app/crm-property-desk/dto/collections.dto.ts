import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import {
  PROPERTY_DESK_AMOUNT_PATTERN,
  PROPERTY_DESK_DATE_PATTERN,
} from '../constants/property-desk.constants';

export class CollectionsListQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  saleContractId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  installmentScheduleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  voucherId?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for collectionDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound for collectionDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo?: string;
}

export class CreateCollectionDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty()
  @IsUUID()
  voucherId!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  saleContractId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  installmentScheduleId?: string | null;

  @ApiProperty({
    description: 'Collection date in YYYY-MM-DD format.',
  })
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'collectionDate must be a valid YYYY-MM-DD value.',
  })
  collectionDate!: string;

  @ApiProperty({
    description: 'Collection amount as a decimal string with up to 2 decimal places.',
    example: '250000.00',
  })
  @IsString()
  @Matches(PROPERTY_DESK_AMOUNT_PATTERN, {
    message:
      'amount must be a non-negative decimal string with up to 2 decimal places.',
  })
  amount!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class CollectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  voucherId!: string;

  @ApiProperty()
  voucherStatus!: string;

  @ApiProperty()
  voucherDate!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  voucherReference!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  bookingId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  installmentScheduleId!: string | null;

  @ApiProperty()
  collectionDate!: string;

  @ApiProperty()
  amount!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  reference!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CollectionsListResponseDto {
  @ApiProperty({
    type: () => [CollectionDto],
  })
  items!: CollectionDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
