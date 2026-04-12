import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { trimToUndefined } from '../../common/utils/dto-transformers';

export class CreateLocationDto {
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
