import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { trimToUndefined } from '../../common/utils/dto-transformers';

export class UpdateCompanyUserDto {
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
}
