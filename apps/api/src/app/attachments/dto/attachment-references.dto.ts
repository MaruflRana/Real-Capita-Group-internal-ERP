import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentEntityType } from '@prisma/client';
import { IsEnum } from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class AttachmentEntityTypesListItemDto {
  @ApiProperty({
    enum: AttachmentEntityType,
  })
  entityType!: AttachmentEntityType;

  @ApiProperty()
  label!: string;
}

export class AttachmentEntityTypesListResponseDto {
  @ApiProperty({
    type: () => [AttachmentEntityTypesListItemDto],
  })
  items!: AttachmentEntityTypesListItemDto[];
}

export class AttachmentEntityReferencesListQueryDto extends ActiveFilterQueryDto {
  @ApiProperty({
    enum: AttachmentEntityType,
  })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;
}

export class AttachmentEntityReferenceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: AttachmentEntityType,
  })
  entityType!: AttachmentEntityType;

  @ApiProperty()
  primaryLabel!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  secondaryLabel!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  contextLabel!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  isActive!: boolean | null;
}

export class AttachmentEntityReferencesListResponseDto {
  @ApiProperty({
    type: () => [AttachmentEntityReferenceDto],
  })
  items!: AttachmentEntityReferenceDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
