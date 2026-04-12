import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

import { trimToUndefined } from '../../common/utils/dto-transformers';

export class CreateCompanyDto {
  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    description:
      'Lowercase company slug used for stable company identification and login selection.',
  })
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, {
    message:
      'slug must contain only lowercase letters, numbers, and hyphens.',
  })
  slug!: string;
}
