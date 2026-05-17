import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

export class CustomersListQueryDto extends ActiveFilterQueryDto {}

export class CreateCustomerDto {
  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class CustomerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  email!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  phone!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  address!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CustomerProfileCustomerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  phone!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  email!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  address!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CustomerProfileSummaryDto {
  @ApiProperty()
  totalBookings!: number;

  @ApiProperty()
  activeBookingCount!: number;

  @ApiProperty()
  saleContractCount!: number;

  @ApiProperty()
  totalContractAmount!: string;

  @ApiProperty()
  installmentScheduleCount!: number;

  @ApiProperty()
  totalScheduledInstallmentAmount!: string;

  @ApiProperty()
  totalCollectionsCount!: number;

  @ApiProperty()
  totalCollectedAmount!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  latestCollectionDate!: string | null;

  @ApiProperty()
  postedVoucherBackedCollectionAmount!: string;
}

export class CustomerProfileBookingDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bookingDate!: string;

  @ApiProperty()
  bookingAmount!: string;

  @ApiProperty()
  status!: string;

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

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractReference!: string | null;
}

export class CustomerProfileSaleContractDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  reference!: string | null;

  @ApiProperty()
  contractDate!: string;

  @ApiProperty()
  contractAmount!: string;

  @ApiProperty()
  bookingId!: string;

  @ApiProperty()
  bookingDate!: string;

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
}

export class CustomerProfileInstallmentScheduleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  saleContractId!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractReference!: string | null;

  @ApiProperty()
  sequenceNumber!: number;

  @ApiProperty()
  dueDate!: string;

  @ApiProperty()
  amount!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  collectedAmount!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  balanceAmount!: string | null;

  @ApiProperty()
  bookingId!: string;

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
}

export class CustomerProfileTransactionDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  reference!: string | null;

  @ApiProperty()
  collectionDate!: string;

  @ApiProperty()
  amount!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty()
  voucherId!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  voucherReference!: string | null;

  @ApiProperty()
  voucherType!: string;

  @ApiProperty()
  voucherDate!: string;

  @ApiProperty()
  voucherStatus!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  bookingId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  bookingDate!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  bookingProjectName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  bookingUnitCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  bookingUnitName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractReference!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  saleContractDate!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  installmentScheduleId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  installmentSequenceNumber!: number | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  installmentDueDate!: string | null;
}

export class CustomerProfileTimelineEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  eventDate!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  recordId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  recordReference!: string | null;
}

export class CustomerProfileDto {
  @ApiProperty({
    type: () => CustomerProfileCustomerDto,
  })
  customer!: CustomerProfileCustomerDto;

  @ApiProperty({
    type: () => CustomerProfileSummaryDto,
  })
  summary!: CustomerProfileSummaryDto;

  @ApiProperty({
    type: () => [CustomerProfileBookingDto],
  })
  bookings!: CustomerProfileBookingDto[];

  @ApiProperty({
    type: () => [CustomerProfileSaleContractDto],
  })
  saleContracts!: CustomerProfileSaleContractDto[];

  @ApiProperty({
    type: () => [CustomerProfileInstallmentScheduleDto],
  })
  installmentSchedules!: CustomerProfileInstallmentScheduleDto[];

  @ApiProperty({
    type: () => [CustomerProfileTransactionDto],
  })
  transactionHistory!: CustomerProfileTransactionDto[];

  @ApiProperty({
    type: () => [CustomerProfileTimelineEventDto],
  })
  timeline!: CustomerProfileTimelineEventDto[];

  @ApiProperty({
    type: () => [String],
  })
  assumptions!: string[];
}

export class CustomersListResponseDto {
  @ApiProperty({
    type: () => [CustomerDto],
  })
  items!: CustomerDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
