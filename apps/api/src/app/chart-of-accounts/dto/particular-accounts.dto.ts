import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { trimToUndefined } from '../../common/utils/dto-transformers';
import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class ParticularAccountsListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsUUID()
  accountClassId?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsUUID()
  accountGroupId?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsUUID()
  ledgerAccountId?: string;
}

export class CreateParticularAccountDto {
  @ApiProperty()
  @IsUUID()
  ledgerAccountId!: string;

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

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateParticularAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ledgerAccountId?: string;

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

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class ParticularAccountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  accountClassId!: string;

  @ApiProperty()
  accountClassCode!: string;

  @ApiProperty()
  accountClassName!: string;

  @ApiProperty()
  accountGroupId!: string;

  @ApiProperty()
  accountGroupCode!: string;

  @ApiProperty()
  accountGroupName!: string;

  @ApiProperty()
  ledgerAccountId!: string;

  @ApiProperty()
  ledgerAccountCode!: string;

  @ApiProperty()
  ledgerAccountName!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ParticularAccountsListResponseDto {
  @ApiProperty({
    type: () => [ParticularAccountDto],
  })
  items!: ParticularAccountDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
