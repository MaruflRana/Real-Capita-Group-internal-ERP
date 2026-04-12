import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentEntityType, AttachmentStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { AUDIT_DATE_PATTERN } from '../../audit/constants/audit.constants';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/i;
const INTEGER_STRING_PATTERN = /^(0|[1-9]\d*)$/;

export class AttachmentsListQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: AttachmentStatus,
  })
  @IsOptional()
  @IsEnum(AttachmentStatus)
  status?: AttachmentStatus;

  @ApiPropertyOptional({
    enum: AttachmentEntityType,
  })
  @IsOptional()
  @IsEnum(AttachmentEntityType)
  entityType?: AttachmentEntityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  uploadedByUserId?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for attachment createdAt in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(AUDIT_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound for attachment createdAt in YYYY-MM-DD format.',
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(AUDIT_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo?: string;
}

export class CreateAttachmentUploadIntentDto {
  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @MaxLength(255)
  originalFileName!: string;

  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty({
    description: 'Attachment size in bytes.',
  })
  @Matches(INTEGER_STRING_PATTERN, {
    message: 'sizeBytes must be a non-negative integer string.',
  })
  sizeBytes!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @trimToUndefined()
  @IsOptional()
  @Matches(SHA256_HEX_PATTERN, {
    message: 'checksumSha256 must be a 64 character hexadecimal SHA-256 digest.',
  })
  checksumSha256?: string | null;
}

export class CreateAttachmentLinkDto {
  @ApiProperty({
    enum: AttachmentEntityType,
  })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;

  @ApiProperty()
  @IsUUID()
  entityId!: string;
}

export class AttachmentLinkDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  attachmentId!: string;

  @ApiProperty({
    enum: AttachmentEntityType,
  })
  entityType!: AttachmentEntityType;

  @ApiProperty()
  entityId!: string;

  @ApiProperty()
  createdById!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  createdByEmail!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  removedById!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  removedByEmail!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({
    nullable: true,
  })
  removedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AttachmentSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  storageBucket!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiProperty()
  originalFileName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty({
    description: 'Attachment size in bytes.',
  })
  sizeBytes!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  checksumSha256!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  objectEtag!: string | null;

  @ApiProperty()
  uploadedById!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  uploadedByEmail!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  archivedById!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  archivedByEmail!: string | null;

  @ApiProperty({
    enum: AttachmentStatus,
  })
  status!: AttachmentStatus;

  @ApiProperty()
  activeLinkCount!: number;

  @ApiProperty({
    type: () => [AttachmentLinkDto],
  })
  links!: AttachmentLinkDto[];

  @ApiPropertyOptional({
    nullable: true,
  })
  uploadCompletedAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  archivedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AttachmentDetailDto extends AttachmentSummaryDto {}

export class AttachmentUploadIntentResponseDto {
  @ApiProperty({
    type: () => AttachmentDetailDto,
  })
  attachment!: AttachmentDetailDto;

  @ApiProperty({
    example: 'PUT',
  })
  uploadMethod!: string;

  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty({
    additionalProperties: {
      type: 'string',
    },
  })
  requiredHeaders!: Record<string, string>;

  @ApiProperty()
  expiresAt!: string;
}

export class AttachmentDownloadAccessDto {
  @ApiProperty()
  attachmentId!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  downloadUrl!: string;

  @ApiProperty()
  expiresAt!: string;
}

export class AttachmentsListResponseDto {
  @ApiProperty({
    type: () => [AttachmentSummaryDto],
  })
  items!: AttachmentSummaryDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
