import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
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
  PROPERTY_DESK_BOOKING_STATUSES,
  PROPERTY_DESK_DATE_PATTERN,
} from '../constants/property-desk.constants';

export class BookingsListQueryDto extends ListQueryDto {
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
    enum: PROPERTY_DESK_BOOKING_STATUSES,
  })
  @IsOptional()
  @IsIn(PROPERTY_DESK_BOOKING_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for bookingDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound for bookingDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty()
  @IsUUID()
  unitId!: string;

  @ApiProperty({
    description: 'Booking date in YYYY-MM-DD format.',
  })
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'bookingDate must be a valid YYYY-MM-DD value.',
  })
  bookingDate!: string;

  @ApiProperty({
    description: 'Booking amount as a decimal string with up to 2 decimal places.',
    example: '50000.00',
  })
  @IsString()
  @Matches(PROPERTY_DESK_AMOUNT_PATTERN, {
    message:
      'bookingAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  bookingAmount!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class BookingDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  projectCode!: string;

  @ApiProperty()
  projectName!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  customerName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  customerEmail!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  customerPhone!: string | null;

  @ApiProperty()
  unitId!: string;

  @ApiProperty()
  unitCode!: string;

  @ApiProperty()
  unitName!: string;

  @ApiProperty()
  unitStatusId!: string;

  @ApiProperty()
  unitStatusCode!: string;

  @ApiProperty()
  unitStatusName!: string;

  @ApiProperty()
  bookingDate!: string;

  @ApiProperty()
  bookingAmount!: string;

  @ApiProperty({
    enum: PROPERTY_DESK_BOOKING_STATUSES,
  })
  status!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  notes!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class BookingsListResponseDto {
  @ApiProperty({
    type: () => [BookingDto],
  })
  items!: BookingDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
