import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  ACCOUNTING_DATE_PATTERN,
} from '../../common/constants/accounting.constants';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import {
  PAYROLL_RUN_STATUSES,
  PAYROLL_YEAR_MAX,
  PAYROLL_YEAR_MIN,
} from '../constants/payroll.constants';

export class PayrollRunsListQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(PAYROLL_YEAR_MIN)
  @Max(PAYROLL_YEAR_MAX)
  payrollYear?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  payrollMonth?: number;

  @ApiPropertyOptional({
    enum: PAYROLL_RUN_STATUSES,
  })
  @IsOptional()
  @IsIn(PAYROLL_RUN_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;
}

export class CreatePayrollRunDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(PAYROLL_YEAR_MIN)
  @Max(PAYROLL_YEAR_MAX)
  payrollYear!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  payrollMonth!: number;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  costCenterId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class UpdatePayrollRunDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(PAYROLL_YEAR_MIN)
  @Max(PAYROLL_YEAR_MAX)
  payrollYear?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  payrollMonth?: number;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  costCenterId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class PostPayrollRunDto {
  @ApiProperty({
    description: 'Voucher date in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'voucherDate must be a valid YYYY-MM-DD value.',
  })
  voucherDate!: string;

  @ApiProperty()
  @IsUUID()
  expenseParticularAccountId!: string;

  @ApiProperty()
  @IsUUID()
  payableParticularAccountId!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  deductionParticularAccountId?: string | null;
}

export class PayrollRunDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  payrollYear!: number;

  @ApiProperty()
  payrollMonth!: number;

  @ApiPropertyOptional({
    nullable: true,
  })
  projectId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  projectCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  projectName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  costCenterId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  costCenterCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  costCenterName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    enum: PAYROLL_RUN_STATUSES,
  })
  status!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  postedVoucherId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  postedVoucherReference!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  postedVoucherDate!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  finalizedAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  cancelledAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  postedAt!: string | null;

  @ApiProperty()
  lineCount!: number;

  @ApiProperty()
  totalBasicAmount!: string;

  @ApiProperty()
  totalAllowanceAmount!: string;

  @ApiProperty()
  totalDeductionAmount!: string;

  @ApiProperty()
  totalNetAmount!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PayrollRunsListResponseDto {
  @ApiProperty({
    type: () => [PayrollRunDto],
  })
  items!: PayrollRunDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
