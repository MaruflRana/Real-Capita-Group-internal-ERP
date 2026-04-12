import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEventCategory, AuditEntityType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';
import { AUDIT_DATE_PATTERN } from '../constants/audit.constants';

export class AuditEventsListQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: AuditEventCategory,
  })
  @IsOptional()
  @IsEnum(AuditEventCategory)
  category?: AuditEventCategory;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({
    enum: AuditEntityType,
  })
  @IsOptional()
  @IsEnum(AuditEntityType)
  targetEntityType?: AuditEntityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetEntityId?: string;

  @ApiPropertyOptional({
    description: 'Start date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(AUDIT_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date in YYYY-MM-DD format.',
  })
  @IsOptional()
  @Matches(AUDIT_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  requestId?: string;
}

export class AuditEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty({
    enum: AuditEventCategory,
  })
  category!: AuditEventCategory;

  @ApiProperty()
  eventType!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  actorUserId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  actorEmail!: string | null;

  @ApiPropertyOptional({
    enum: AuditEntityType,
    nullable: true,
  })
  targetEntityType!: AuditEntityType | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  targetEntityId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  requestId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    additionalProperties: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;
}

export class AuditEventsListResponseDto {
  @ApiProperty({
    type: () => [AuditEventDto],
  })
  items!: AuditEventDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
