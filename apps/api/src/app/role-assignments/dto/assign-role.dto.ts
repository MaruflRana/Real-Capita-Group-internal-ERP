import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches, MaxLength } from 'class-validator';

import { trimToUndefined } from '../../common/utils/dto-transformers';

export class AssignRoleDto {
  @ApiProperty()
  @trimToUndefined()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/u, {
    message:
      'roleCode must contain only lowercase letters, numbers, and underscores.',
  })
  roleCode!: string;
}
