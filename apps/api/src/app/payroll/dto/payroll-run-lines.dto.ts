import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { ACCOUNTING_AMOUNT_PATTERN } from '../../common/constants/accounting.constants';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

export class PayrollRunLinesListQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class PayrollRunLineInputDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({
    example: '50000.00',
  })
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'basicAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  basicAmount!: string;

  @ApiProperty({
    example: '5000.00',
  })
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'allowanceAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  allowanceAmount!: string;

  @ApiProperty({
    example: '2500.00',
  })
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'deductionAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  deductionAmount!: string;

  @ApiProperty({
    example: '52500.00',
  })
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'netAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  netAmount!: string;
}

export class CreatePayrollRunLineDto extends PayrollRunLineInputDto {}

export class UpdatePayrollRunLineDto {
  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'basicAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  basicAmount?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'allowanceAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  allowanceAmount?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'deductionAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  deductionAmount?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @Matches(ACCOUNTING_AMOUNT_PATTERN, {
    message:
      'netAmount must be a non-negative decimal string with up to 2 decimal places.',
  })
  @MaxLength(21)
  netAmount?: string;
}

export class BulkUpsertPayrollRunLinesDto {
  @ApiProperty({
    type: () => [PayrollRunLineInputDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PayrollRunLineInputDto)
  lines!: PayrollRunLineInputDto[];
}

export class PayrollRunLineDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  payrollRunId!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  employeeFullName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationName!: string | null;

  @ApiProperty()
  basicAmount!: string;

  @ApiProperty()
  allowanceAmount!: string;

  @ApiProperty()
  deductionAmount!: string;

  @ApiProperty()
  netAmount!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PayrollRunLinesListResponseDto {
  @ApiProperty({
    type: () => [PayrollRunLineDto],
  })
  items!: PayrollRunLineDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
