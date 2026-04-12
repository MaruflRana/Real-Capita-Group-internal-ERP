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

export class SaleContractsListQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for contractDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound for contractDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo?: string;
}

export class CreateSaleContractDto {
  @ApiProperty()
  @IsUUID()
  bookingId!: string;

  @ApiProperty({
    description: 'Contract date in YYYY-MM-DD format.',
  })
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'contractDate must be a valid YYYY-MM-DD value.',
  })
  contractDate!: string;

  @ApiProperty({
    description: 'Contract amount as a decimal string with up to 2 decimal places.',
    example: '8500000.00',
  })
  @IsString()
  @Matches(PROPERTY_DESK_AMOUNT_PATTERN, {
    message:
      'contractAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  contractAmount!: string;

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

export class UpdateSaleContractDto {
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

export class SaleContractDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  bookingId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  projectCode!: string;

  @ApiProperty()
  projectName!: string;

  @ApiProperty()
  unitId!: string;

  @ApiProperty()
  unitCode!: string;

  @ApiProperty()
  unitName!: string;

  @ApiProperty()
  bookingDate!: string;

  @ApiProperty()
  bookingAmount!: string;

  @ApiProperty()
  contractDate!: string;

  @ApiProperty()
  contractAmount!: string;

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

export class SaleContractsListResponseDto {
  @ApiProperty({
    type: () => [SaleContractDto],
  })
  items!: SaleContractDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
