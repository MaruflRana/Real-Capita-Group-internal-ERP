import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { toOptionalBoolean } from '../utils/dto-transformers';
import { ListQueryDto } from './list-query.dto';

export class ActiveFilterQueryDto extends ListQueryDto {
  @ApiPropertyOptional()
  @toOptionalBoolean()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
