import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

export class CompanyUsersListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional({
    description: 'Filter users by company-scoped role code.',
  })
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/u, {
    message: 'roleCode must contain only lowercase letters, numbers, and underscores.',
  })
  roleCode?: string;
}
