import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import { PROPERTY_DESK_LEAD_STATUSES } from '../constants/property-desk.constants';

export class LeadsListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    enum: PROPERTY_DESK_LEAD_STATUSES,
  })
  @IsOptional()
  @IsIn(PROPERTY_DESK_LEAD_STATUSES)
  status?: string;
}

export class CreateLeadDto {
  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

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
  @MaxLength(120)
  source?: string | null;

  @ApiPropertyOptional({
    enum: PROPERTY_DESK_LEAD_STATUSES,
  })
  @IsOptional()
  @IsIn(PROPERTY_DESK_LEAD_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

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
  @MaxLength(120)
  source?: string | null;

  @ApiPropertyOptional({
    enum: PROPERTY_DESK_LEAD_STATUSES,
  })
  @IsOptional()
  @IsIn(PROPERTY_DESK_LEAD_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class LeadDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

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
  source!: string | null;

  @ApiProperty({
    enum: PROPERTY_DESK_LEAD_STATUSES,
  })
  status!: string;

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

export class LeadsListResponseDto {
  @ApiProperty({
    type: () => [LeadDto],
  })
  items!: LeadDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
