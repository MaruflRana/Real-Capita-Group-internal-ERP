import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { trimToUndefined } from '../../common/utils/dto-transformers';

export class CreateCompanyUserDto {
  @ApiProperty()
  @trimToUndefined()
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    minLength: 12,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiProperty({
    type: [String],
    description:
      'Initial company-scoped role codes to attach when the user is created.',
  })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) =>
          typeof item === 'string' ? item.trim().toLowerCase() : item,
        )
      : value,
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({
    each: true,
  })
  @Matches(/^[a-z0-9_]+$/u, {
    each: true,
    message:
      'each role code must contain only lowercase letters, numbers, and underscores.',
  })
  roleCodes!: string[];
}
