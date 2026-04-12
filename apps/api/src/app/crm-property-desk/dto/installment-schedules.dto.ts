import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import {
  PROPERTY_DESK_AMOUNT_PATTERN,
  PROPERTY_DESK_DATE_PATTERN,
  PROPERTY_DESK_DUE_STATES,
} from '../constants/property-desk.constants';

export class InstallmentSchedulesListQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  saleContractId?: string;

  @ApiPropertyOptional({
    enum: PROPERTY_DESK_DUE_STATES,
  })
  @IsOptional()
  @IsIn(PROPERTY_DESK_DUE_STATES)
  dueState?: string;
}

export class CreateInstallmentScheduleRowDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber!: number;

  @ApiProperty({
    description: 'Installment due date in YYYY-MM-DD format.',
  })
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dueDate must be a valid YYYY-MM-DD value.',
  })
  dueDate!: string;

  @ApiProperty({
    description: 'Installment amount as a decimal string with up to 2 decimal places.',
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
  @MaxLength(500)
  description?: string | null;
}

export class CreateInstallmentSchedulesDto {
  @ApiProperty()
  @IsUUID()
  saleContractId!: string;

  @ApiProperty({
    type: () => [CreateInstallmentScheduleRowDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInstallmentScheduleRowDto)
  rows!: CreateInstallmentScheduleRowDto[];
}

export class UpdateInstallmentScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber?: number;

  @ApiPropertyOptional({
    description: 'Installment due date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(PROPERTY_DESK_DATE_PATTERN, {
    message: 'dueDate must be a valid YYYY-MM-DD value.',
  })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Installment amount as a decimal string with up to 2 decimal places.',
  })
  @IsOptional()
  @IsString()
  @Matches(PROPERTY_DESK_AMOUNT_PATTERN, {
    message:
      'amount must be a non-negative decimal string with up to 2 decimal places.',
  })
  amount?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class InstallmentScheduleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  saleContractId!: string;

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
  sequenceNumber!: number;

  @ApiProperty()
  dueDate!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  collectedAmount!: string;

  @ApiProperty()
  balanceAmount!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class InstallmentSchedulesListResponseDto {
  @ApiProperty({
    type: () => [InstallmentScheduleDto],
  })
  items!: InstallmentScheduleDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
