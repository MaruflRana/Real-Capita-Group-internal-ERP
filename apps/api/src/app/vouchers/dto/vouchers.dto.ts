import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import {
  ACCOUNTING_AMOUNT_PATTERN,
  ACCOUNTING_DATE_PATTERN,
  ACCOUNTING_VOUCHER_STATUSES,
  ACCOUNTING_VOUCHER_TYPES,
} from '../../common/constants/accounting.constants';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class VouchersListQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: ACCOUNTING_VOUCHER_TYPES,
  })
  @IsOptional()
  @IsIn(ACCOUNTING_VOUCHER_TYPES)
  voucherType?: string;

  @ApiPropertyOptional({
    enum: ACCOUNTING_VOUCHER_STATUSES,
  })
  @IsOptional()
  @IsIn(ACCOUNTING_VOUCHER_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for voucherDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound for voucherDate in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo?: string;
}

export class CreateVoucherDraftDto {
  @ApiProperty({
    enum: ACCOUNTING_VOUCHER_TYPES,
  })
  @IsIn(ACCOUNTING_VOUCHER_TYPES)
  voucherType!: string;

  @ApiProperty({
    description: 'Voucher date in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'voucherDate must be a valid YYYY-MM-DD value.',
  })
  voucherDate!: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class UpdateVoucherDraftDto {
  @ApiPropertyOptional({
    enum: ACCOUNTING_VOUCHER_TYPES,
  })
  @IsOptional()
  @IsIn(ACCOUNTING_VOUCHER_TYPES)
  voucherType?: string;

  @ApiPropertyOptional({
    description: 'Voucher date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'voucherDate must be a valid YYYY-MM-DD value.',
  })
  voucherDate?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class CreateVoucherLineDto {
  @ApiProperty()
  @IsUUID()
  particularAccountId!: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Debit amount as a decimal string with up to 2 decimal places.',
    example: '1250.00',
  })
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'debitAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  debitAmount!: string;

  @ApiProperty({
    description: 'Credit amount as a decimal string with up to 2 decimal places.',
    example: '0.00',
  })
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'creditAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  creditAmount!: string;
}

export class UpdateVoucherLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  particularAccountId?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Debit amount as a decimal string with up to 2 decimal places.',
  })
  @IsOptional()
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'debitAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  debitAmount?: string;

  @ApiPropertyOptional({
    description: 'Credit amount as a decimal string with up to 2 decimal places.',
  })
  @IsOptional()
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'creditAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  creditAmount?: string;
}

export class VoucherLineDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  voucherId!: string;

  @ApiProperty()
  lineNumber!: number;

  @ApiProperty()
  particularAccountId!: string;

  @ApiProperty()
  particularAccountCode!: string;

  @ApiProperty()
  particularAccountName!: string;

  @ApiProperty()
  ledgerAccountId!: string;

  @ApiProperty()
  ledgerAccountCode!: string;

  @ApiProperty()
  ledgerAccountName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  debitAmount!: string;

  @ApiProperty()
  creditAmount!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class VoucherDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty({
    enum: ACCOUNTING_VOUCHER_TYPES,
  })
  voucherType!: string;

  @ApiProperty({
    enum: ACCOUNTING_VOUCHER_STATUSES,
  })
  status!: string;

  @ApiProperty()
  voucherDate!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  reference!: string | null;

  @ApiProperty()
  createdById!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  postedById!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  postedAt!: string | null;

  @ApiProperty()
  lineCount!: number;

  @ApiProperty()
  totalDebit!: string;

  @ApiProperty()
  totalCredit!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class VoucherDetailDto extends VoucherDto {
  @ApiProperty({
    type: () => [VoucherLineDto],
  })
  lines!: VoucherLineDto[];
}

export class VouchersListResponseDto {
  @ApiProperty({
    type: () => [VoucherDto],
  })
  items!: VoucherDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
