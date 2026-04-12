import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import { ACCOUNTING_AMOUNT_PATTERN } from '../../common/constants/accounting.constants';

export class SalaryStructuresListQueryDto extends ActiveFilterQueryDto {}

export class CreateSalaryStructureDto {
  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

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

export class UpdateSalaryStructureDto {
  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

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

export class SalaryStructureDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  basicAmount!: string;

  @ApiProperty()
  allowanceAmount!: string;

  @ApiProperty()
  deductionAmount!: string;

  @ApiProperty()
  netAmount!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class SalaryStructuresListResponseDto {
  @ApiProperty({
    type: () => [SalaryStructureDto],
  })
  items!: SalaryStructureDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
